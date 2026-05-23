const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Utility to strip HTML
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').trim();
}

// Utility to transform Google Drive sharing URLs to direct public CDN URLs
function transformDriveUrl(url) {
    if (!url) return url;
    if (url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/id=([^&]+)/) || url.match(/\/file\/d\/([^/]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
        }
    }
    return url;
}

// Utility to parse and format weight from CSV columns
function formatWeight(grams, unit) {
    const parsedGrams = parseFloat(grams);
    if (!isNaN(parsedGrams) && parsedGrams > 0) {
        if (parsedGrams >= 1000) {
            return `${parsedGrams / 1000}kg`;
        }
        return `${parsedGrams}g`;
    }
    if (unit) {
        return unit;
    }
    return '250g'; // Default fallback
}

async function run() {
    console.log('Connecting to database...');
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Disabling foreign key constraints and clearing existing products and product images...');
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE product_images');
    await db.query('TRUNCATE TABLE products');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Existing tables cleared successfully.');

    // Ensure categories exist - use slug as key to match slug lookups perfectly
    const categoryMap = {};
    const [existingCats] = await db.query('SELECT id, slug FROM categories');
    for (const c of existingCats) {
        if (c.slug) {
            categoryMap[c.slug.toLowerCase()] = c.id;
        }
    }

    const products = {};
    
    // Dynamically check which CSV to import
    let csvFileName = 'products_export_1 (1).csv';
    const templatePath = path.join(__dirname, '../product_template.csv');
    if (fs.existsSync(templatePath)) {
        csvFileName = 'product_template.csv';
    }
    const csvPath = path.join(__dirname, `../${csvFileName}`);

    console.log(`Reading CSV file from: ${csvPath}`);

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
            // Clean BOM and spaces from row keys dynamically
            const cleanedRow = {};
            for (const key of Object.keys(row)) {
                const cleanKey = key.trim().replace(/^\ufeff/, '');
                cleanedRow[cleanKey] = row[key];
            }

            const handle = cleanedRow['URL handle'] || cleanedRow['Handle'];
            if (!handle) return;

            if (!products[handle]) {
                const title = cleanedRow['Title'];
                const descRaw = cleanedRow['Description'] || cleanedRow['Body (HTML)'];
                const desc = stripHtml(descRaw);
                const categoryStr = cleanedRow['Product category'] || cleanedRow['Product Category'] || '';
                
                const rawPrice = cleanedRow['Price'] || cleanedRow['Variant Price'];
                const rawCompare = cleanedRow['Compare-at price'] || cleanedRow['Variant Compare At Price'] || rawPrice;
                const price = parseFloat(rawPrice) || 0;
                const comparePrice = parseFloat(rawCompare) || price;

                const statusStr = (cleanedRow['Status'] || '').toLowerCase();
                const isDraft = statusStr === 'draft';
                const status = isDraft ? 0 : 1;

                const rawGrams = cleanedRow['Weight value (grams)'] || cleanedRow['Variant Grams'];
                const rawUnit = cleanedRow['Weight unit for display'] || cleanedRow['Variant Weight Unit'];
                const weight = formatWeight(rawGrams, rawUnit);

                products[handle] = {
                    handle,
                    title,
                    description: desc,
                    categoryStr,
                    price,
                    comparePrice,
                    status,
                    weight,
                    brand: cleanedRow['Vendor'] || 'Bhavnagris',
                    mainImage: null,
                    images: []
                };
            }

            const rawImgUrl = cleanedRow['Product image URL'] || cleanedRow['Image Src'];
            const imgUrl = transformDriveUrl(rawImgUrl);
            const imgPos = cleanedRow['Image position'] || cleanedRow['Image Position'];
            
            if (imgUrl) {
                if (imgPos === '1' || !products[handle].mainImage) {
                    products[handle].mainImage = imgUrl;
                } else {
                    products[handle].images.push({ url: imgUrl, position: parseInt(imgPos) || 2 });
                }
            }
        })
        .on('end', async () => {
            console.log('CSV file successfully processed. Inserting new products into DB...');
            let insertedCount = 0;

            for (const handle in products) {
                const p = products[handle];
                
                // Only process main rows (which have title)
                if (!p.title) {
                    console.log(`Skipping handle ${handle} because title is missing.`);
                    continue;
                }

                // Determine category
                let catId = 1; // Default Snacks
                if (p.categoryStr.toLowerCase().includes('health')) {
                    if (!categoryMap['perfumes']) {
                        const [res] = await db.query('INSERT INTO categories (name, slug) VALUES (?, ?)', ['Perfumes', 'perfumes']);
                        categoryMap['perfumes'] = res.insertId;
                    }
                    catId = categoryMap['perfumes'];
                } else if (p.categoryStr.toLowerCase().includes('religious') || p.categoryStr.toLowerCase().includes('incense') || p.categoryStr.toLowerCase().includes('home & garden')) {
                    if (!categoryMap['puja-essentials']) {
                        const [res] = await db.query('INSERT INTO categories (name, slug) VALUES (?, ?)', ['Puja Essentials', 'puja-essentials']);
                        categoryMap['puja-essentials'] = res.insertId;
                    }
                    catId = categoryMap['puja-essentials'];
                }

                // Since we truncated products, we just perform clean inserts
                const [res] = await db.query(`
                    INSERT INTO products (category_id, name, slug, description, original_price, selling_price, weight, stock_quantity, image, brand, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 100, ?, ?, ?)
                `, [catId, p.title, p.handle, p.description, p.comparePrice, p.price, p.weight, p.mainImage, p.brand, p.status]);
                
                const prodId = res.insertId;
                
                // Add extra images if present
                for (const img of p.images) {
                    await db.query('INSERT INTO product_images (product_id, image_url, sequence_order) VALUES (?, ?, ?)', [prodId, img.url, img.position]);
                }
                
                insertedCount++;
            }
            
            console.log(`Successfully imported ${insertedCount} products with direct CDN image URLs.`);
            await db.end();
        });
}

run().catch(console.error);
