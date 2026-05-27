const pool = require('../config/db');

const mappings = [
    { id: 25, image: 'uploads/fulwadi_gathiya.png' },
    { id: 26, image: 'uploads/tomato_sev.png' },
    { id: 27, image: 'uploads/lasan_sev.png' },
    { id: 28, image: 'uploads/ratlami_sev.png' },
    { id: 29, image: 'uploads/garlic_bhujia.png' },
    { id: 30, image: 'uploads/chana_bhujia.png' },
    { id: 31, image: 'uploads/aloo_bhujia.png' }
];

async function run() {
    console.log('=== STARTING PRODUCT IMAGE DB MAPPING UPDATE ===');
    
    try {
        for (const item of mappings) {
            console.log(`Updating product ID ${item.id} with image path "${item.image}"...`);
            const [result] = await pool.query(
                'UPDATE products SET image = ? WHERE id = ?',
                [item.image, item.id]
            );
            
            if (result.affectedRows > 0) {
                console.log(`SUCCESS: Product ID ${item.id} updated.`);
            } else {
                console.warn(`WARNING: Product ID ${item.id} not found or no change made.`);
            }
        }
        
        console.log('=== ALL MAPPINGS COMPLETED SUCCESSFULY ===');
    } catch (err) {
        console.error('FATAL DB ERROR:', err.message);
    } finally {
        process.exit(0);
    }
}

run().catch(console.error);
