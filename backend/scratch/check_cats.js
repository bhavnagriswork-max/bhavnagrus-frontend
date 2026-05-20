const pool = require('../config/db');

async function checkCategories() {
    try {
        const [rows] = await pool.query('SELECT name, image FROM categories');
        console.log('Categories in DB:', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCategories();
