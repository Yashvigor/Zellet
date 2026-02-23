import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import voucherRoutes from './routes/vouchers.js';
import adminRoutes from './routes/admin.js';
import rewardsRoutes from './routes/rewards.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rewards', rewardsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Zellet Backend API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
