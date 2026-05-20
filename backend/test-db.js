const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
    console.log('Connecting to database...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bhavnagar_food_ecommerce',
        });
        console.log('Connected successfully!');
        const [rows] = await connection.query('SHOW TABLES');
        console.log('Tables:', rows);
        await connection.end();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

test();
