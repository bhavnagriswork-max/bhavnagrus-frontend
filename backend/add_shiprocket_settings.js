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
            INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
            ('shiprocket_enabled', 'false'),
            ('shiprocket_email', ''),
            ('shiprocket_password', ''),
            ('shiprocket_pickup_postcode', '364001'),
            ('shiprocket_length', '10'),
            ('shiprocket_width', '10'),
            ('shiprocket_height', '10')
        `);
        console.log('Shiprocket settings added to settings table successfully');
    } catch (err) {
        console.error('Error running Shiprocket settings migration:', err);
    } finally {
        await pool.end();
    }
}

run();
