const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

async function check() {
    try {
        console.log('Connecting to:', process.env.DB_NAME);
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('SUCCESS: Connected to database');
        
        const [rows] = await connection.query('SHOW TABLES');
        console.log('Tables found:', rows.map(r => Object.values(r)[0]).join(', '));
        
        await connection.end();
    } catch (err) {
        console.error('FAILURE: Could not connect to database');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
    }
}

check();
