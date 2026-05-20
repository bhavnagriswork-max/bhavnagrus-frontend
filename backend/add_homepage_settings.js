require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const pool = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await pool.query(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
            ('hero_badge', 'Established 1948 • Bhavnagar'),
            ('hero_cta_text', 'Order Now'),
            ('hero_image', ''),
            ('products_title', 'Signature <br/><span class="text-white/20">Hand-Picked Mix</span>'),
            ('products_subtitle', 'Select your favorite traditional flavors from our curated collection.'),
            ('cta_title', 'Savor the <br/> <span class="italic text-white/20">Legacy.</span>'),
            ('cta_button_text', 'Start Your Order'),
            ('trust_1_title', 'Freshly Made'),
            ('trust_1_subtitle', 'Handcrafted Daily'),
            ('trust_2_title', 'Fast Delivery'),
            ('trust_2_subtitle', 'Across India'),
            ('trust_3_title', 'Hygienic'),
            ('trust_3_subtitle', 'FSSAI Certified'),
            ('trust_4_title', 'Secure Pay'),
            ('trust_4_subtitle', 'UPI & COD'),
            ('mission_title', 'Every Single Order <br> <span class="text-white/30 italic">Feeds a Stray Life.</span>'),
            ('mission_subtitle', 'Our heritage is built on more than just taste; it\\'s built on kindness. For every order you place, we commit to feeding a dog in need.')
        `);
        console.log('Homepage settings added successfully');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
