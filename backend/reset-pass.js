const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function reset() {
    try {
        console.log('Generating new hash for: admin123');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        console.log('Updating Admin user...');
        await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, 'admin@bhavnagarfood.com']);

        console.log('✅ SUCCESS: Admin password has been reset to: admin123');
        process.exit(0);
    } catch (err) {
        console.error('❌ FAILURE:', err.message);
        process.exit(1);
    }
}

reset();
