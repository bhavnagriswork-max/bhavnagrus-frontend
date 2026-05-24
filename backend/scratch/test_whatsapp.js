require('dotenv').config({ path: 'c:/Users/shukl/OneDrive/Desktop/code for new web/backend/.env' });
const pool = require('../config/db');
const { sendWhatsAppOrderAlert } = require('../utils/whatsapp');

async function testAlert() {
    console.log('--- STARTING WHATSAPP ALERT UTILITY INTEGRATION TEST ---');
    
    // Construct mock order
    const mockOrder = {
        order_number: 'TEST_ORD_WA_9999',
        customer_name: 'Harsh Bhavnagri',
        customer_mobile: '9999999999', // 10-digit raw number
        total_amount: 450.00,
        payment_method: 'COD',
        address_line1: 'Sardar Patel Nagar, Block B-402',
        address_line2: 'Near Heritage Lake',
        city: 'Bhavnagar',
        state: 'Gujarat',
        pincode: '364001'
    };

    // Construct mock items
    const mockItems = [
        { name: 'Bhavnagari Gathiya', quantity: 2, selling_price: 150.00 },
        { name: 'Tikha Gathiya', quantity: 1, selling_price: 150.00 }
    ];

    try {
        console.log('\nExecuting alert utility dispatch (with current DB settings)...');
        // This will read your current DB settings (whatsapp_enabled = 'false' by default)
        // and check that it exits gracefully without throws or crashes
        await sendWhatsAppOrderAlert(mockOrder, mockItems);
        console.log('SUCCESS: Graceful fallback and execution verified!');
        
    } catch (err) {
        console.error('FAILED:', err);
    } finally {
        await pool.end();
        console.log('\n--- WHATSAPP INTEGRATION TEST COMPLETE ---');
    }
}

testAlert();
