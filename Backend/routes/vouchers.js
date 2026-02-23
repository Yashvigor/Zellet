import express from 'express';
import pool from '../db.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get active vouchers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const vouchersRes = await pool.query('SELECT voucher_id as id, voucher_code as code, voucher_amount as amount, status, expiry_date as expiry, min_balance, event_category, max_uses, used_count FROM vouchers ORDER BY created_at DESC');
        res.json(vouchersRes.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch vouchers' });
    }
});

// Admin: Create voucher
router.post('/create', authenticateToken, isAdmin, async (req, res) => {
    const { code, amount, expiry, min_balance = 0, event_category = 'None', max_uses = 1000 } = req.body;
    if (!code || amount <= 0 || !expiry) return res.status(400).json({ error: 'Invalid input' });

    try {
        const insertRes = await pool.query(
            `INSERT INTO vouchers (voucher_code, voucher_amount, expiry_date, status, min_balance, event_category, max_uses) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING voucher_id as id, voucher_code as code, voucher_amount as amount, status, expiry_date as expiry, min_balance, event_category, max_uses, used_count`,
            [code, amount, expiry, 'Active', min_balance, event_category, max_uses]
        );
        res.json(insertRes.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Voucher code already exists' });
        }
        res.status(500).json({ error: 'Failed to create voucher' });
    }
});

// Apply voucher
router.post('/apply', authenticateToken, async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Voucher code required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check voucher
        const voucherRes = await client.query('SELECT voucher_id, voucher_amount as amount, status, expiry_date, min_balance, event_category, max_uses, used_count FROM vouchers WHERE voucher_code = $1 FOR UPDATE', [code]);
        if (voucherRes.rows.length === 0) throw new Error('Invalid voucher code');
        const voucher = voucherRes.rows[0];

        if (voucher.status !== 'Active') throw new Error(`Voucher is ${voucher.status}`);
        if (new Date(voucher.expiry_date) < new Date()) {
            await client.query("UPDATE vouchers SET status = 'Expired' WHERE voucher_id = $1", [voucher.voucher_id]);
            throw new Error('Voucher is expired');
        }

        if (voucher.used_count >= voucher.max_uses) {
            await client.query("UPDATE vouchers SET status = 'Used' WHERE voucher_id = $1", [voucher.voucher_id]);
            throw new Error('Voucher redemption limit reached');
        }

        // Check if user already redeemed this voucher
        const redeemedRes = await client.query('SELECT redemption_id FROM voucher_redemptions WHERE voucher_id = $1 AND user_id = $2', [voucher.voucher_id, req.user.userId]);
        if (redeemedRes.rows.length > 0) throw new Error('You have already redeemed this voucher');

        // Check Main Wallet for min_balance requirement
        const walletRes = await client.query('SELECT wallet_id, balance FROM wallets WHERE user_id = $1 AND wallet_type = $2 FOR UPDATE', [req.user.userId, 'Main']);
        if (walletRes.rows.length === 0) throw new Error('Wallet not found');
        const wallet = walletRes.rows[0];

        if (parseFloat(wallet.balance) < parseFloat(voucher.min_balance)) {
            throw new Error(`Minimum wallet balance of ₹${voucher.min_balance} required`);
        }

        // Check Event Category Requirements
        if (voucher.event_category === 'First Transaction') {
            const userTxRes = await client.query('SELECT transaction_id FROM transactions WHERE sender_id = $1 OR receiver_id = $1 LIMIT 1', [req.user.userId]);
            if (userTxRes.rows.length > 0) {
                throw new Error('This voucher is only valid for your first transaction');
            }
        }

        // --- All checks passed ---

        // Apply to User's Main Wallet
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [voucher.amount, wallet.wallet_id]);

        // Update Voucher uses
        const newUsedCount = voucher.used_count + 1;
        let newStatus = 'Active';
        if (newUsedCount >= voucher.max_uses) newStatus = 'Used';

        await client.query("UPDATE vouchers SET used_count = $1, status = $2 WHERE voucher_id = $3", [newUsedCount, newStatus, voucher.voucher_id]);

        // Record Redemption
        await client.query('INSERT INTO voucher_redemptions (voucher_id, user_id) VALUES ($1, $2)', [voucher.voucher_id, req.user.userId]);

        // Record transaction
        await client.query(
            `INSERT INTO transactions (sender_id, receiver_id, amount, transaction_type, status) 
             VALUES (NULL, $1, $2, 'Voucher Credit', 'Success')`,
            [req.user.userId, voucher.amount]
        );

        // Add Log
        await client.query(`INSERT INTO activity_logs (user_id, action_type, description) VALUES ($1, $2, $3)`,
            [req.user.userId, 'Voucher application', `Applied voucher ${code} for ₹${voucher.amount}`]);

        await client.query('COMMIT');
        res.json({ message: 'Voucher applied successfully', amount: voucher.amount, newBalance: parseFloat(wallet.balance) + parseFloat(voucher.amount) });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message || 'Failed to apply voucher' });
    } finally {
        client.release();
    }
});

export default router;
