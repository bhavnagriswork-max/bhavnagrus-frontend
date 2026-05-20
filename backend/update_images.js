const mysql = require('mysql2/promise');

async function run() {
    const pool = await mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'bhavnagris_db'
    });

    try {
        console.log('Updating product images...');
        
        // Update Fadada / Gathiya
        await pool.query("UPDATE products SET image = 'assets/images/fadada.png' WHERE name LIKE '%Fadada%' OR name LIKE '%Gathiya%'");
        
        // Update Soan Papdi
        await pool.query("UPDATE products SET image = 'assets/images/soan-papdi.png' WHERE name LIKE '%Soan Papdi%' OR name LIKE '%Sweet%'");
        
        // Update others to use the hero image if they don't have one
        await pool.query("UPDATE products SET image = 'assets/images/hero-snacks.png' WHERE image IS NULL OR image = ''");

        console.log('Successfully updated product imagery.');
    } catch (err) {
        console.error('Error updating database:', err);
    } finally {
        await pool.end();
    }
}

run();
