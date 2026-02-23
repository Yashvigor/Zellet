import pool from './db.js';

async function updateDb() {
    try {
        console.log("Starting database update...");

        // Add tier to users
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'Silver' CHECK (tier IN ('Silver', 'Gold', 'Platinum'));`);
        console.log("Added tier column to users.");

        // Update vouchers table
        await pool.query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS min_balance NUMERIC(15, 2) DEFAULT 0.00;`);
        await pool.query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS event_category VARCHAR(50) DEFAULT 'None';`);
        await pool.query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1000;`);
        await pool.query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;`);
        console.log("Added rule columns to vouchers.");

        // Create voucher_redemptions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS voucher_redemptions (
                redemption_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                voucher_id UUID REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
                redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(voucher_id, user_id)
            );
        `);
        console.log("Created voucher_redemptions table.");

        // Add index
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_voucher_redemptions ON voucher_redemptions(voucher_id, user_id);`);

        console.log("Database update completed successfully.");
    } catch (error) {
        console.error("Error updating database:", error);
    } finally {
        pool.end();
    }
}

updateDb();
