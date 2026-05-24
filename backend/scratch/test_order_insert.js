require('dotenv').config({ path: 'c:/Users/shukl/OneDrive/Desktop/code for new web/backend/.env' });
const mysql = require('mysql2/promise');

async function testInsert() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    
    try {
        console.log('Test 1: Guest checkout order insert with COD...');
        await connection.query(
            `INSERT INTO orders 
            (order_number, user_id, customer_name, customer_email, customer_mobile, address_line1, address_line2, city, state, pincode, subtotal, delivery_charge, discount_amount, total_amount, payment_method) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['TEST_ORD_GUEST_COD', null, 'Guest User', 'guest@example.com', '9999999999', 'Street 1', 'Street 2', 'Bhavnagar', 'Gujarat', '364001', 100, 50, 0, 150, 'COD']
        );
        console.log('Test 1 SUCCESS!');
    } catch (err) {
        console.error('Test 1 FAILED:', err.message);
    }
    
    try {
        console.log('\nTest 2: Logged-in checkout order insert with ONLINE payment...');
        await connection.query(
            `INSERT INTO orders 
            (order_number, user_id, customer_name, customer_email, customer_mobile, address_line1, address_line2, city, state, pincode, subtotal, delivery_charge, discount_amount, total_amount, payment_method) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['TEST_ORD_USER_ONLINE', 1, 'Logged In User', 'user@example.com', '9999999999', 'Street 1', 'Street 2', 'Bhavnagar', 'Gujarat', '364001', 100, 50, 0, 150, 'ONLINE']
        );
        console.log('Test 2 SUCCESS!');
    } catch (err) {
        console.error('Test 2 FAILED:', err.message);
    }
    
    await connection.end();
}

testInsert();
