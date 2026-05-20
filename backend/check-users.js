const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function check() {
    try {
        const [users] = await pool.query('SELECT id, name, email, password, role FROM users');
        console.log('--- USERS IN DATABASE ---');
        for (const user of users) {
            const isMatch = await bcrypt.compare('admin123', user.password);
            console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
            console.log(`Password 'admin123' matches: ${isMatch}`);
            console.log('------------------------');
        }
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}

check();
