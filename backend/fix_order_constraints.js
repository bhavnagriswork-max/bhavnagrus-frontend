require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Altering orders table to make user_id nullable...');
        await connection.query('ALTER TABLE orders MODIFY user_id INT NULL;');
        console.log('SUCCESS: user_id is now nullable in orders table!');
        
        console.log('Altering orders table to support ONLINE payment method enum...');
        await connection.query("ALTER TABLE orders MODIFY payment_method ENUM('COD','UPI','NET_BANKING','ONLINE') NOT NULL;");
        console.log('SUCCESS: payment_method enum expanded to support ONLINE!');
        
    } catch (err) {
        console.error('Error running fix_order_constraints migration:', err);
    } finally {
        await connection.end();
    }
}

run();
