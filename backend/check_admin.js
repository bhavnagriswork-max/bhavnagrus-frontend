const pool = require('./config/db');

async function checkAdmin() {
    try {
        const [users] = await pool.query("SELECT id, name, email, role FROM users WHERE email = 'admin@bhavnagarfood.com'");
        console.log(users);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAdmin();
