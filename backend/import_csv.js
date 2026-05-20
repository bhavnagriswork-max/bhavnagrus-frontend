const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Utility to strip HTML
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').trim();
}

async function run() {
    console.log('Connecting to DB...');
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    // Ensure categories exist
    const categoryMap = {};
    const [existingCats] = await db.query('SELECT id, name FROM categories');
    for (const c of existingCats) {
        categoryMap[c.name.toLowerCase()] = c.id;
    }

    const products = {};

    fs.createReadStream('../products_export_1 (1).csv')
        .pipe(csv())
        .on('data', (row) => {
            const handle = row['Handle'];
            if (!handle) return;

            if (!products[handle]) {
                products[handle] = {
                    handle,
                    title: row['Title'],
                    description: stripHtml(row['Body (HTML)']),
                    categoryStr: row['Product Category'] || '',
                    price: row['Variant Price'] || '0',
                    comparePrice: row['Variant Compare At Price'] || row['Variant Price'] || '0',
                    status: row['Status'] === 'active' ? 1 : 0,
                    mainImage: null,
                    images: []
                };
            }

            const imgUrl = row['Image Src'];
            const imgPos = row['Image Position'];
            if (imgUrl) {
                if (imgPos === '1' || !products[handle].mainImage) {
                    products[handle].mainImage = imgUrl;
                } else {
                    products[handle].images.push({ url: imgUrl, position: imgPos });
                }
            }
        })
        .on('end', async () => {
            console.log('CSV file successfully processed. Inserting into DB...');
            let insertedCount = 0;

            for (const handle in products) {
                const p = products[handle];
                
                // Only process main rows (which have title)
                if (!p.title) continue;

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

                // Insert or update product
                let prodId;
                const [existing] = await db.query('SELECT id FROM products WHERE slug = ?', [p.handle]);
                if (existing.length > 0) {
                    prodId = existing[0].id;
                    await db.query(`
                        UPDATE products SET 
                        category_id=?, name=?, description=?, original_price=?, selling_price=?, image=?, is_active=?
                        WHERE id=?
                    `, [catId, p.title, p.description, p.comparePrice, p.price, p.mainImage, p.status, prodId]);
                } else {
                    const [res] = await db.query(`
                        INSERT INTO products (category_id, name, slug, description, original_price, selling_price, weight, stock_quantity, image, is_active)
                        VALUES (?, ?, ?, ?, ?, ?, '250g', 100, ?, ?)
                    `, [catId, p.title, p.handle, p.description, p.comparePrice, p.price, p.mainImage, p.status]);
                    prodId = res.insertId;
                }
                
                // Clear existing extra images and add new ones
                await db.query('DELETE FROM product_images WHERE product_id = ?', [prodId]);
                
                for (const img of p.images) {
                    await db.query('INSERT INTO product_images (product_id, image_url, sequence_order) VALUES (?, ?, ?)', [prodId, img.url, img.position]);
                }
                
                insertedCount++;
            }
            
            console.log(`Successfully processed ${insertedCount} products.`);
            await db.end();
        });
}

run().catch(console.error);
