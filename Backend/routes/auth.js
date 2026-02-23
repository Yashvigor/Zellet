import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Google credential token is missing' });
    }

    try {
        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error("Invalid Google Payload");
        }

        const { email, name, sub: googleId } = payload;

        // 2. Database Transaction to check user & create if not exists
        const clientDb = await pool.connect();
        try {
            await clientDb.query('BEGIN');

            // Check if user already exists based on email
            let userResult = await clientDb.query(
                `SELECT user_id, name, email, role FROM users WHERE email = $1`,
                [email]
            );

            let user;
            const now = new Date();

            if (userResult.rows.length > 0) {
                // User exists -> Log Login
                user = userResult.rows[0];
                await clientDb.query(
                    `INSERT INTO activity_logs (user_id, action_type, description, timestamp) VALUES ($1, $2, $3, $4)`,
                    [user.user_id, 'Login', 'User logged in via Google Auth', now]
                );
            } else {
                // User does not exist -> Create User, Wallet, and log Sign Up
                // We generate a random password hash since they use Google to log in
                // In a real system, you'd mark this account as 'google_sso_only'
                const mockPasswordHash = `google_oauth_${googleId}`;

                const insertUser = await clientDb.query(
                    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role, tier`,
                    [name, email, mockPasswordHash, 'user']
                );
                user = insertUser.rows[0];

                // Create Default 'Main' Wallet
                await clientDb.query(
                    `INSERT INTO wallets (user_id, wallet_type, balance) VALUES ($1, $2, $3)`,
                    [user.user_id, 'Main', 0.00]
                );

                // Log Sign Up
                await clientDb.query(
                    `INSERT INTO activity_logs (user_id, action_type, description, timestamp) VALUES ($1, $2, $3, $4)`,
                    [user.user_id, 'Sign Up', 'New user registered via Google Auth', now]
                );
            }

            // 3. Generate JWT Session Token
            const token = jwt.sign(
                { userId: user.user_id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '24h' }
            );

            await clientDb.query('COMMIT');

            return res.status(200).json({
                message: 'Authentication successful',
                token,
                user: {
                    id: user.user_id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tier: user.tier
                }
            });

        } catch (dbError) {
            await clientDb.query('ROLLBACK');
            throw dbError;
        } finally {
            clientDb.release();
        }

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ error: 'Authentication failed', details: error.message });
    }
});

// --- NATIVE AUTHENTICATION --- //

router.post('/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const clientDb = await pool.connect();
    try {
        await clientDb.query('BEGIN');

        // Check if email is already in use
        const existingUser = await clientDb.query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert User
        const insertUser = await clientDb.query(
            `INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role, tier`,
            [name, email, phone || null, passwordHash, 'user']
        );
        const user = insertUser.rows[0];

        // Create Default 'Main' Wallet
        await clientDb.query(
            `INSERT INTO wallets (user_id, wallet_type, balance) VALUES ($1, $2, $3)`,
            [user.user_id, 'Main', 0.00]
        );

        // Log Sign Up
        await clientDb.query(
            `INSERT INTO activity_logs (user_id, action_type, description, timestamp) VALUES ($1, $2, $3, $4)`,
            [user.user_id, 'Sign Up', 'New user registered natively', new Date()]
        );

        // Generate JWT Session Token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        await clientDb.query('COMMIT');

        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                tier: user.tier
            }
        });

    } catch (error) {
        await clientDb.query('ROLLBACK');
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Failed to register', details: error.message });
    } finally {
        clientDb.release();
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Fetch user by email
        const userResult = await pool.query(
            'SELECT user_id, name, email, password_hash, role, tier FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = userResult.rows[0];

        // Ensure user hasn't signed up with Google only
        if (user.password_hash.startsWith('google_oauth_')) {
            return res.status(401).json({ error: 'This account was created with Google Sign-In. Please use Google to log in.' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Log Login
        await pool.query(
            `INSERT INTO activity_logs (user_id, action_type, description, timestamp) VALUES ($1, $2, $3, $4)`,
            [user.user_id, 'Login', 'User logged in natively', new Date()]
        );

        // Generate JWT Session Token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                tier: user.tier
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Failed to log in', details: error.message });
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT user_id as id, name, email, role, tier FROM users WHERE user_id = $1', [req.user.userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(userRes.rows[0]);
    } catch (err) {
        console.error('/me Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
