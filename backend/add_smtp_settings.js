const pool = require('./config/db');

async function addSMTPSettings() {
    try {
        await pool.query("INSERT INTO settings (setting_key, setting_value) VALUES ('smtp_user', '') ON DUPLICATE KEY UPDATE setting_value = setting_value");
        await pool.query("INSERT INTO settings (setting_key, setting_value) VALUES ('smtp_pass', '') ON DUPLICATE KEY UPDATE setting_value = setting_value");
        console.log('SMTP settings initialized in DB');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

addSMTPSettings();
