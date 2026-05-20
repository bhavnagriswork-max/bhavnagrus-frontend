const pool = require('./config/db');

async function expandSystem() {
    try {
        // 1. Add Hero Settings
        const heroSettings = [
            ['hero_title', 'Traditional Taste, Modern Luxury'],
            ['hero_subtitle', 'Savor the authentic heritage of Bhavnagar food, crafted with love and tradition.'],
            ['hero_image', ''],
            ['hero_video_url', '']
        ];
        for (let [key, val] of heroSettings) {
            await pool.query("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = setting_value", [key, val]);
        }

        // 2. Create Reviews Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                rating INT NOT NULL DEFAULT 5,
                comment TEXT,
                image_url VARCHAR(255),
                is_approved TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        console.log('Hero settings and Reviews table initialized');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

expandSystem();
