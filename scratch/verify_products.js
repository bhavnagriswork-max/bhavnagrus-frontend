const pool = require('../backend/config/db');

async function verify() {
    try {
        console.log('Querying categories...');
        const [categories] = await pool.query('SELECT id, name, slug FROM categories');
        console.log('Categories found:', categories);

        console.log('Querying product count...');
        const [prodCount] = await pool.query('SELECT COUNT(*) as count FROM products');
        console.log('Total products count:', prodCount[0].count);

        console.log('Querying sample products...');
        const [products] = await pool.query('SELECT id, name, selling_price, category_id, image FROM products LIMIT 5');
        console.log('Sample products:', products);

        console.log('Querying product images count...');
        const [imgCount] = await pool.query('SELECT COUNT(*) as count FROM product_images');
        console.log('Total extra images count:', imgCount[0].count);

        console.log('VERIFICATION SUCCESSFUL!');
    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        process.exit();
    }
}

verify();
