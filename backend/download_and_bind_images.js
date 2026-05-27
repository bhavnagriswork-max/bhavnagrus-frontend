const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pool = require('./config/db');

const uploadsDir = path.join(__dirname, 'uploads');

async function downloadImage(url, destPath) {
    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const writer = fs.createWriteStream(destPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(true));
            writer.on('error', (err) => {
                console.error(`Writer error for ${destPath}:`, err);
                reject(err);
            });
        });
    } catch (err) {
        console.error(`Axios request error for URL ${url}:`, err.message);
        return false;
    }
}

async function run() {
    console.log('=== STARTING IMAGE DOWNLOAD & STRICT DB BINDING ===');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
        console.log(`Creating uploads directory: ${uploadsDir}`);
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    try {
        // 1. Fetch all products from database
        const [products] = await pool.query('SELECT id, name, slug, image FROM products');
        console.log(`Auditing ${products.length} products...`);

        let downloadSuccessCount = 0;
        let dbUpdateCount = 0;

        for (const product of products) {
            console.log(`\nProduct ID ${product.id}: "${product.name}"`);
            const currentImage = product.image ? product.image.trim() : '';

            if (!currentImage) {
                console.warn(`[WARNING] Product "${product.name}" has no image field!`);
                continue;
            }

            // Check if the image is an external URL (Google Drive, Unsplash, etc.)
            if (currentImage.startsWith('http://') || currentImage.startsWith('https://')) {
                console.log(`  -> Current image is external URL: ${currentImage}`);
                
                // Define local destination filename using product slug to guarantee one-to-one mapping
                const fileExt = '.png'; // Standardize on .png as per frontend configuration
                const filename = `${product.slug}${fileExt}`;
                const destPath = path.join(uploadsDir, filename);
                const localDbPath = `uploads/${filename}`;

                console.log(`  -> Downloading to: ${destPath}`);
                const success = await downloadImage(currentImage, destPath);

                if (success) {
                    const stats = fs.statSync(destPath);
                    console.log(`  [SUCCESS] Downloaded to ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
                    downloadSuccessCount++;

                    // Update DB with local path
                    console.log(`  -> Binding DB to local path: "${localDbPath}"`);
                    const [updateResult] = await pool.query(
                        'UPDATE products SET image = ? WHERE id = ?',
                        [localDbPath, product.id]
                    );

                    if (updateResult.affectedRows > 0) {
                        console.log(`  [SUCCESS] DB updated for Product ID ${product.id}`);
                        dbUpdateCount++;
                    } else {
                        console.warn(`  [WARNING] DB update affected 0 rows for Product ID ${product.id}`);
                    }
                } else {
                    console.error(`  [FAILED] Could not download image for "${product.name}"`);
                }
            } else {
                console.log(`  -> Already bound to local path: "${currentImage}"`);
            }
        }

        console.log('\n================ SUMMARY ================');
        console.log(`Total Products Audited: ${products.length}`);
        console.log(`Successful Downloads: ${downloadSuccessCount}`);
        console.log(`DB Mappings Updated: ${dbUpdateCount}`);
        console.log('=========================================');

    } catch (err) {
        console.error('FATAL RUNTIME ERROR:', err);
    } finally {
        // Exit process
        await pool.end();
        process.exit(0);
    }
}

run();
