-- Zellet Database Schema - PostgreSQL

-- Enable UUID extension for secure, unguessable IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'auditor')),
    tier VARCHAR(20) DEFAULT 'Silver' CHECK (tier IN ('Silver', 'Gold', 'Platinum')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Wallets Table
-- Supports Multi-Wallet (Main, Sa9vings, Reward) and Freeze Status out of the box
CREATE TABLE wallets (
    wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    wallet_type VARCHAR(50) DEFAULT 'Main' CHECK (wallet_type IN ('Main', 'Savings', 'Reward')),
    balance NUMERIC(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Frozen', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, wallet_type) -- A user can only have one of each type
);

-- 3. Transactions Table
-- ACID Compliant design with statuses
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('Credit', 'Debit', 'Transfer', 'Voucher Credit')),
    status VARCHAR(20) DEFAULT 'Success' CHECK (status IN ('Pending', 'Success', 'Failed')),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Vouchers Table
CREATE TABLE vouchers (
    voucher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_code VARCHAR(50) UNIQUE NOT NULL,
    voucher_amount NUMERIC(15, 2) NOT NULL CHECK (voucher_amount > 0),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Used', 'Expired')),
    min_balance NUMERIC(15, 2) DEFAULT 0.00,
    event_category VARCHAR(50) DEFAULT 'None',
    max_uses INTEGER DEFAULT 1000,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4.b. Voucher Redemptions Table
CREATE TABLE voucher_redemptions (
    redemption_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(voucher_id, user_id)
);

-- 5. Activity Logs Table
-- Immutable audit log
CREATE TABLE activity_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


