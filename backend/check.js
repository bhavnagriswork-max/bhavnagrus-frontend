const pool = require('./config/db');

async function check() {
    try {
        console.log('Testing pool connection...');
        const [rows] = await pool.query('SHOW TABLES');
        console.log('SUCCESS: Tables found:', rows.map(r => Object.values(r)[0]).join(', '));
        process.exit(0);
    } catch (err) {
        console.error('FAILURE ERROR:', err);
        process.exit(1);
    }
}

check();
