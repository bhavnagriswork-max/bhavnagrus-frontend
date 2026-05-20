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
        await pool.query("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('upi_id', ''), ('upi_name', ''), ('upi_qr_image', '')");
        console.log('UPI settings added successfully');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
