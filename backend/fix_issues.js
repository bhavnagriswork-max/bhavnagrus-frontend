const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

async function fix() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    // 1. Fix contact_inquiries.mobile - make it nullable
    await conn.query("ALTER TABLE contact_inquiries MODIFY mobile VARCHAR(15) DEFAULT ''");
    console.log('1. contact_inquiries.mobile now allows empty values');

    // 2. Fix null/empty product images
    await conn.query("UPDATE products SET image = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80' WHERE id = 1");
    await conn.query("UPDATE products SET image = 'https://images.unsplash.com/photo-1589114471223-fa0812726359?w=800&q=80' WHERE id = 2");
    await conn.query("UPDATE products SET image = 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80' WHERE id = 22");
    console.log('2. Fixed null/empty images for products 1, 2, 22');

    // 3. Set hero_image
    await conn.query("UPDATE settings SET setting_value = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80' WHERE setting_key = 'hero_image'");
    console.log('3. Set hero_image in settings');

    // Verify
    const [prods] = await conn.query('SELECT id, name, image FROM products WHERE id IN (1,2,22)');
    console.log('Verify products:', JSON.stringify(prods, null, 2));

    const [hero] = await conn.query("SELECT setting_value FROM settings WHERE setting_key = 'hero_image'");
    console.log('Verify hero_image:', hero[0].setting_value);

    await conn.end();
    console.log('\nAll database fixes applied successfully!');
}

fix().catch(console.error);
