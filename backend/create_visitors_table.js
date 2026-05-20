require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const pool = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS site_visitors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(50),
                user_agent TEXT,
                page_url VARCHAR(500),
                referrer VARCHAR(500),
                device_type ENUM('Desktop', 'Mobile', 'Tablet') DEFAULT 'Desktop',
                country VARCHAR(100) DEFAULT '',
                session_id VARCHAR(100),
                user_id INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created (created_at),
                INDEX idx_session (session_id),
                INDEX idx_ip (ip_address)
            )
        `);
        console.log('site_visitors table created successfully');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
