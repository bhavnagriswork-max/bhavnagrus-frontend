const pool = require('./backend/config/db');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        await pool.query("UPDATE users SET password = ? WHERE role = 'admin'", [hashedPassword]);
        console.log('Admin password reset to: admin123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetAdmin();
