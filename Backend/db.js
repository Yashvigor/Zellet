import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    user: process.env.DATABASE_URL ? undefined : (process.env.DB_USER || 'postgres'),
    host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
    database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'zellet'),
    password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
    port: process.env.DATABASE_URL ? undefined : (process.env.DB_PORT || 5432),
});

export default pool;
