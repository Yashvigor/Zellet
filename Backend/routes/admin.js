import express from 'express';
import pool from '../db.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all system data for Admin Dashboard
router.get('/data', authenticateToken, isAdmin, async (req, res) => {
    try {
        const usersRes = await pool.query('SELECT user_id as id, name, email, phone, role, tier FROM users');
        const walletsRes = await pool.query('SELECT wallet_id as id, user_id, wallet_type, balance, status FROM wallets');
        const vouchersRes = await pool.query('SELECT voucher_id as id, voucher_code as code, voucher_amount as amount, status, expiry_date as expiry, min_balance, used_count, max_uses FROM vouchers');
        const logsRes = await pool.query(`
            SELECT a.log_id as id, a.user_id, u.email as user_email, a.action_type, a.description, a.timestamp 
            FROM activity_logs a 
            JOIN users u ON a.user_id = u.user_id 
            ORDER BY a.timestamp DESC
        `);
        const txRes = await pool.query(`
            SELECT t.transaction_id as id, t.amount, t.transaction_type as type, t.transaction_date as date, t.status,
            t.sender_id, t.receiver_id,
            (SELECT email FROM users u WHERE u.user_id = t.sender_id) as sender_email,
            (SELECT email FROM users u WHERE u.user_id = t.receiver_id) as receiver_email
            FROM transactions t
            ORDER BY t.transaction_date DESC
        `);

        res.json({
            users: usersRes.rows,
            wallets: walletsRes.rows,
            transactions: txRes.rows,
            vouchers: vouchersRes.rows,
            logs: logsRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch admin data' });
    }
});
// Update user tier
router.post('/user/tier', authenticateToken, isAdmin, async (req, res) => {
    const { userId, tier } = req.body;
    if (!userId || !tier) return res.status(400).json({ error: 'User ID and tier are required' });
    if (!['Silver', 'Gold', 'Platinum'].includes(tier)) return res.status(400).json({ error: 'Invalid tier' });

    try {
        await pool.query('UPDATE users SET tier = $1 WHERE user_id = $2', [tier, userId]);
        await pool.query(`INSERT INTO activity_logs (user_id, action_type, description) VALUES ($1, $2, $3)`,
            [req.user.userId, 'Admin Action', `Updated user ${userId} to ${tier} tier`]);
        res.json({ message: 'User tier updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user tier' });
    }
});

// Update wallet status (Freeze/Active)
router.post('/wallet/status', authenticateToken, isAdmin, async (req, res) => {
    const { walletId, status } = req.body;
    if (!walletId || !status) return res.status(400).json({ error: 'Wallet ID and status are required' });
    if (!['Active', 'Frozen', 'Closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    try {
        await pool.query('UPDATE wallets SET status = $1 WHERE wallet_id = $2', [status, walletId]);
        await pool.query(`INSERT INTO activity_logs (user_id, action_type, description) VALUES ($1, $2, $3)`,
            [req.user.userId, 'Admin Action', `Changed wallet ${walletId} status to ${status}`]);
        res.json({ message: 'Wallet status updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update wallet status' });
    }
});

// Manual fund adjustment (Credit / Debit)
router.post('/wallet/adjust', authenticateToken, isAdmin, async (req, res) => {
    const { walletId, amount, type } = req.body; // type can be 'Credit' or 'Debit'
    if (!walletId || !amount || amount <= 0 || !type) return res.status(400).json({ error: 'Valid wallet ID, amount, and type are required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if wallet exists and get owner
        const walletRes = await client.query('SELECT user_id, balance, status FROM wallets WHERE wallet_id = $1 FOR UPDATE', [walletId]);
        if (walletRes.rows.length === 0) throw new Error('Wallet not found');

        const wallet = walletRes.rows[0];

        let queryStr;
        let queryParams;

        if (type === 'Credit') {
            queryStr = 'UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2';
            queryParams = [amount, walletId];
        } else if (type === 'Debit') {
            if (parseFloat(wallet.balance) < parseFloat(amount)) throw new Error('Insufficient funds for debit adjustment');
            queryStr = 'UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2';
            queryParams = [amount, walletId];
        } else {
            throw new Error('Invalid adjustment type. Must be Credit or Debit');
        }

        await client.query(queryStr, queryParams);

        // Log transaction
        await client.query(
            `INSERT INTO transactions (sender_id, receiver_id, amount, transaction_type, status) 
             VALUES (NULL, $1, $2, 'Admin Adjustment', 'Success')`,
            [wallet.user_id, amount]
        );

        // Activity log
        await client.query(`INSERT INTO activity_logs (user_id, action_type, description) VALUES ($1, $2, $3)`,
            [req.user.userId, 'Admin Action', `Manually ${type}ed ₹${amount} for wallet ${walletId}`]);

        await client.query('COMMIT');
        res.json({ message: `Successfully ${type.toLowerCase()}ed funds.` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ error: err.message || 'Failed to adjust funds' });
    } finally {
        client.release();
    }
});

export default router;
