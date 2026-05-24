require('dotenv').config({ path: 'c:/Users/shukl/OneDrive/Desktop/code for new web/backend/.env' });
const mysql = require('mysql2/promise');

async function cleanup() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    
    try {
        console.log('Cleaning up test orders...');
        const [res] = await connection.query("DELETE FROM orders WHERE order_number IN ('TEST_ORD_GUEST_COD', 'TEST_ORD_USER_ONLINE')");
        console.log(`Deleted ${res.affectedRows} test orders successfully!`);
    } catch (err) {
        console.error('Cleanup failed:', err.message);
    } finally {
        await connection.end();
    }
}

cleanup();
