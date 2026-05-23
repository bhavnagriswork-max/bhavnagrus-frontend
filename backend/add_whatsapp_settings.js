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
        console.log('Inserting default WhatsApp notification keys into settings table...');
        await pool.query(`
            INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
            ('whatsapp_enabled', 'false'),
            ('whatsapp_provider', 'ultramsg'),
            ('whatsapp_instance_id', ''),
            ('whatsapp_token', ''),
            ('whatsapp_sender_number', '')
        `);
        console.log('SUCCESS: WhatsApp notification configurations inserted successfully!');
    } catch (err) {
        console.error('Error running WhatsApp settings migration:', err);
    } finally {
        await pool.end();
    }
}

run();
