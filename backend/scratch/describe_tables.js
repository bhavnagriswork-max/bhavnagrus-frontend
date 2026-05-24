require('dotenv').config({ path: 'c:/Users/shukl/OneDrive/Desktop/code for new web/backend/.env' });
const mysql = require('mysql2/promise');

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('DESCRIBE orders:');
        const [ordersColumns] = await connection.query('DESCRIBE orders');
        console.log(ordersColumns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
        
        console.log('\nDESCRIBE order_items:');
        const [itemsColumns] = await connection.query('DESCRIBE order_items');
        console.log(itemsColumns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
        
        await connection.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
