const pool = require('../backend/config/db');

async function checkTable() {
    try {
        const [rows] = await pool.query('DESCRIBE product_images');
        console.log('product_images schema:', rows);
        
        const hasSequence = rows.some(r => r.Field === 'sequence_order');
        if (!hasSequence) {
            console.log('Adding sequence_order column...');
            await pool.query('ALTER TABLE product_images ADD COLUMN sequence_order INT DEFAULT 0');
            console.log('Column added successfully.');
        } else {
            console.log('sequence_order column already exists.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkTable();
