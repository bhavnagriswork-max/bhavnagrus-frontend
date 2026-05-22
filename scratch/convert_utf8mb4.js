const pool = require('../backend/config/db');

async function convert() {
    try {
        console.log('Altering database character set to utf8mb4...');
        await pool.query('ALTER DATABASE bqv6zhaewgm8mvtusoi1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        
        console.log('Converting categories table...');
        await pool.query('ALTER TABLE categories CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        
        console.log('Converting products table...');
        await pool.query('ALTER TABLE products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        
        console.log('Converting product_images table...');
        await pool.query('ALTER TABLE product_images CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        
        console.log('Converting reviews table...');
        await pool.query('ALTER TABLE reviews CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

        console.log('SUCCESS: All tables converted to utf8mb4!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

convert();
