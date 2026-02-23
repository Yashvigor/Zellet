import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper: Calculate Points (50 INR = 1 Point) and update user Tier
const grantRewardPoints = async (client, userId, transactionAmount) => {
    const points = Math.floor(transactionAmount / 50);
    if (points > 0) {
        await client.query(`
            INSERT INTO wallets (user_id, wallet_type, balance) 
            VALUES ($1, 'Reward', $2)
            ON CONFLICT (user_id, wallet_type) 
            DO UPDATE SET balance = wallets.balance + EXCLUDED.balance
        `, [userId, points]);
    }

    // Tier upgrade logic based on total transaction volume
    const volumeRes = await client.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE (sender_id = $1 OR receiver_id = $1) AND status = 'Success'
    `, [userId]);
    const totalVolume = Number(volumeRes.rows[0].total) + transactionAmount;

    let newTier = 'Silver';
    if (totalVolume >= 50000) newTier = 'Platinum';
    else if (totalVolume >= 10000) newTier = 'Gold';

    await client.query(`UPDATE users SET tier = $1 WHERE user_id = $2`, [newTier, userId]);
};

// Get the user's primary wallet
router.get('/', authenticateToken, async (req, res) => {
    try {
        const walletResult = await pool.query(
            'SELECT wallet_id, balance FROM wallets WHERE user_id = $1 AND wallet_type = $2',
            [req.user.userId, 'Main']
        );
        if (walletResult.rows.length === 0) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        res.json(walletResult.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch wallet' });
    }
});

// Add money to wallet
router.post('/add', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Add money
        const walletRes = await client.query(
            'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 AND wallet_type = $3 RETURNING wallet_id, balance',
            [amount, req.user.userId, 'Main']
        );

        const walletId = walletRes.rows[0].wallet_id;

        // Record transaction
        await client.query(
            `INSERT INTO transactions (sender_id, receiver_id, amount, transaction_type, status) 
             VALUES (NULL, $1, $2, 'Credit', 'Success')`,
            [req.user.userId, amount]
        );

        // Add log
        await client.query(
            `INSERT INTO activity_logs (user_id, action_type, description) VALUES ($1, $2, $3)`,
            [req.user.userId, 'Wallet balance update', `Added ₹${amount} to wallet`]
        );

        // Calculate and grant reward points & tier update
        await grantRewardPoints(client, req.user.userId, amount);

        await client.query('COMMIT');
        res.json(walletRes.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to add money' });
    } finally {
        client.release();
    }
});

// Send money to another user
router.post('/transfer', authenticateToken, async (req, res) => {
    const { receiverEmail, amount } = req.body;
    if (amount <= 0 || !receiverEmail) return res.status(400).json({ error: 'Invalid input' });
    if (receiverEmail === req.user.email) return res.status(400).json({ error: 'Cannot send money to yourself' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Find Sender Wallet
        const senderRes = await client.query('SELECT wallet_id, balance FROM wallets WHERE user_id = $1 AND wallet_type = $2 FOR UPDATE', [req.user.userId, 'Main']);
        if (senderRes.rows.length === 0) throw new Error('Sender wallet not found');
        const senderWallet = senderRes.rows[0];

        if (senderWallet.balance < amount) throw new Error('Insufficient balance');

        // 2. Find Receiver by Email
        const receiverUserRes = await client.query('SELECT user_id FROM users WHERE email = $1', [receiverEmail]);
        if (receiverUserRes.rows.length === 0) throw new Error('Receiver not found');
        const receiverUserId = receiverUserRes.rows[0].user_id;

        // 3. Find Receiver Wallet
        const receiverRes = await client.query('SELECT wallet_id FROM wallets WHERE user_id = $1 AND wallet_type = $2 FOR UPDATE', [receiverUserId, 'Main']);
        if (receiverRes.rows.length === 0) throw new Error('Receiver wallet not found');
        const receiverWalletId = receiverRes.rows[0].wallet_id;

        // 4. Deduct from Sender
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2', [amount, senderWallet.wallet_id]);

        // 5. Add to Receiver
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [amount, receiverWalletId]);

        // 6. Record Transaction
        await client.query(
            `INSERT INTO transactions (sender_id, receiver_id, amount, transaction_type, status) 
             VALUES ($1, $2, $3, 'Transfer', 'Success')`,
            [req.user.userId, receiverUserId, amount]
        );

        // 7. Add Logs
        await client.query(`INSERT INTO activity_logs (user_id, action_type, description) VALUES ($1, $2, $3)`,
            [req.user.userId, 'Fund transfer', `Sent ₹${amount} to ${receiverEmail}`]);
        await client.query(`INSERT INTO activity_logs (user_id, action_type, description) VALUES ($1, $2, $3)`,
            [receiverUserId, 'Fund transfer', `Received ₹${amount} from ${req.user.email}`]);

        // 8. Grant Points to Sender for the transaction
        await grantRewardPoints(client, req.user.userId, amount);

        await client.query('COMMIT');

        // Return updated sender balance
        res.json({ message: 'Transfer successful', newBalance: senderWallet.balance - amount });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ error: err.message || 'Transfer failed' });
    } finally {
        client.release();
    }
});

// Get user transactions
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const walletResult = await pool.query('SELECT wallet_id FROM wallets WHERE user_id = $1 AND wallet_type = $2', [req.user.userId, 'Main']);
        if (walletResult.rows.length === 0) return res.json([]);
        const walletId = walletResult.rows[0].wallet_id;

        // Fetch transactions where the user is sender OR receiver
        // Enhance with receiver/sender email details
        const txQuery = `
            SELECT t.transaction_id as id, t.amount, t.transaction_type as type, t.transaction_date as date, t.status,
            CASE 
                WHEN t.sender_id = $1 THEN 'Sent'
                WHEN t.receiver_id = $1 THEN 'Received'
                ELSE 'Unknown'
            END as direction,
            (SELECT email FROM users u WHERE u.user_id = t.receiver_id) as receiver_email,
            (SELECT email FROM users u WHERE u.user_id = t.sender_id) as sender_email
            FROM transactions t
            WHERE t.sender_id = $1 OR t.receiver_id = $1
            ORDER BY t.transaction_date DESC
        `;
        const txs = await pool.query(txQuery, [req.user.userId]);

        // Format them to match existing frontend expectations
        const formattedTxs = txs.rows.map(tx => ({
            id: tx.id,
            type: tx.type, // 'Transfer', 'Credit', 'Voucher Credit'
            amount: parseFloat(tx.amount),
            date: tx.date,
            status: tx.status,
            // Reconstruct the logic the frontend expects. If direction is 'Sent' we subtract. If 'Received' we add. 
            // In the frontend, it assumes sender_id === current_user_id means it's a debit.
            sender_id: tx.direction === 'Sent' ? req.user.userId : tx.sender_email,
            receiver_id: tx.direction === 'Received' ? req.user.userId : tx.receiver_email,
        }));

        res.json(formattedTxs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

export default router;
