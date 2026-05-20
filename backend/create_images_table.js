const pool = require('./config/db');

async function createImagesTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                is_main TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('product_images table created');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createImagesTable();
