const pool = require('./config/db');

async function checkUser() {
    try {
        const [users] = await pool.query("SELECT id, email, role FROM users WHERE email LIKE '%harsh%'");
        console.log('Matching Users:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
