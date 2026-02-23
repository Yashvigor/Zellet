import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get the user's reward wallet balance
router.get('/', authenticateToken, async (req, res) => {
    try {
        const walletResult = await pool.query(
            'SELECT balance FROM wallets WHERE user_id = $1 AND wallet_type = $2',
            [req.user.userId, 'Reward']
        );
        if (walletResult.rows.length === 0) {
            return res.json({ balance: 0 }); // Default 0 if no reward wallet
        }
        res.json({ balance: parseFloat(walletResult.rows[0].balance) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reward wallet' });
    }
});

// Convert reward points to Main wallet balance
router.post('/convert', authenticateToken, async (req, res) => {
    const { pointsToConvert } = req.body;
    if (pointsToConvert <= 0) return res.status(400).json({ error: 'Invalid points amount' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check reward wallet balance
        const rewardRes = await client.query('SELECT wallet_id, balance FROM wallets WHERE user_id = $1 AND wallet_type = $2 FOR UPDATE', [req.user.userId, 'Reward']);
        if (rewardRes.rows.length === 0 || rewardRes.rows[0].balance < pointsToConvert) {
            throw new Error('Insufficient reward points');
        }

        const rewardWalletId = rewardRes.rows[0].wallet_id;

        // Check main wallet
        const mainRes = await client.query('SELECT wallet_id FROM wallets WHERE user_id = $1 AND wallet_type = $2 FOR UPDATE', [req.user.userId, 'Main']);
        if (mainRes.rows.length === 0) throw new Error('Main wallet not found');
        const mainWalletId = mainRes.rows[0].wallet_id;

        // Deduct points
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2', [pointsToConvert, rewardWalletId]);

        // Add INR equivalent to main (1 Point = 1 INR conversion rate)
        const inrAmount = pointsToConvert; // Conversion Logic: 1 point = 1 INR
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [inrAmount, mainWalletId]);

        // Record as Transaction (Type: Credit from Rewards)
        await client.query(
            `INSERT INTO transactions (sender_id, receiver_id, amount, transaction_type, status) 
             VALUES (NULL, $1, $2, 'Credit', 'Success')`,
            [req.user.userId, inrAmount]
        );

        // Record Logs
        await client.query(
            `INSERT INTO activity_logs (user_id, action_type, description) VALUES ($1, $2, $3)`,
            [req.user.userId, 'Reward Conversion', `Converted ${pointsToConvert} points to ₹${inrAmount}`]
        );

        await client.query('COMMIT');
        res.json({ message: 'Points converted successfully', newAddedAmount: inrAmount });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ error: err.message || 'Conversion failed' });
    } finally {
        client.release();
    }
});

export default router;
