const pool = require('./backend/config/db');

async function checkAdmin() {
    try {
        const [users] = await pool.query("SELECT id, name, email, role FROM users WHERE role = 'admin'");
        console.log('Admin Users:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAdmin();
