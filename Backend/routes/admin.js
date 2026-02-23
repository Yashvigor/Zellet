import express from 'express';
import pool from '../db.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all system data for Admin Dashboard
router.get('/data', authenticateToken, isAdmin, async (req, res) => {
    try {
        const usersRes = await pool.query('SELECT user_id as id, name, email, phone, role FROM users');
        const walletsRes = await pool.query('SELECT wallet_id as id, user_id, wallet_type, balance FROM wallets');
        const vouchersRes = await pool.query('SELECT voucher_id as id, voucher_code as code, voucher_amount as amount, status, expiry_date as expiry FROM vouchers');
        const logsRes = await pool.query(`
            SELECT a.log_id as id, a.user_id, u.email as user_email, a.action_type, a.description, a.timestamp 
            FROM activity_logs a 
            JOIN users u ON a.user_id = u.user_id 
            ORDER BY a.timestamp DESC
        `);
        const txRes = await pool.query(`
            SELECT t.transaction_id as id, t.amount, t.transaction_type as type, t.transaction_date as date, t.status,
            (SELECT email FROM users u WHERE u.user_id = t.sender_id) as sender_id,
            (SELECT email FROM users u WHERE u.user_id = t.receiver_id) as receiver_id
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

export default router;
