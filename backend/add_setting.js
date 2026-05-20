const pool = require('./config/db');

async function addSetting() {
    try {
        await pool.query("INSERT INTO settings (setting_key, setting_value) VALUES ('admin_order_email', 'harshmn0@gmail.com') ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
        console.log('Admin order email setting added successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

addSetting();
