const pool = require('../config/db');

async function run() {
  console.log('=== STARTING DATABASE RESTRUCTURE ===');

  // 1. Alter table to add tags column
  try {
    console.log('Adding "tags" column to products table...');
    // We query INFORMATION_SCHEMA first to see if column exists
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'tags'`
    );
    if (cols.length === 0) {
      await pool.query('ALTER TABLE products ADD COLUMN tags VARCHAR(255) DEFAULT NULL');
      console.log('Column "tags" added successfully.');
    } else {
      console.log('Column "tags" already exists.');
    }
  } catch (err) {
    console.error('Error adding tags column:', err.message);
  }

  // 2. Insert or get categories: Gathiya, Sev, Bhujia
  const categories = [
    {
      name: 'Gathiya',
      slug: 'gathiya',
      description: 'Authentic traditional Gujarati Gathiya, crafted using generational recipes and pure ingredients.',
      image: 'assets/placeholder-luxury.jpg'
    },
    {
      name: 'Sev',
      slug: 'sev',
      description: 'Crispy, crunchy traditional Sev vermicelli, seasoned with hand-picked master masalas.',
      image: 'assets/placeholder-luxury.jpg'
    },
    {
      name: 'Bhujia',
      slug: 'bhujia',
      description: 'The ultimate bold and fiery Bhujia, prepared with clean gram flour and traditional spices.',
      image: 'assets/placeholder-luxury.jpg'
    }
  ];

  const categoryIds = {};

  for (const cat of categories) {
    try {
      const [existing] = await pool.query('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
      if (existing.length > 0) {
        categoryIds[cat.slug] = existing[0].id;
        // Update description just in case
        await pool.query('UPDATE categories SET description = ? WHERE id = ?', [cat.description, existing[0].id]);
        console.log(`Category "${cat.name}" already exists with ID: ${existing[0].id}`);
      } else {
        const [result] = await pool.query(
          'INSERT INTO categories (name, slug, description, image) VALUES (?, ?, ?, ?)',
          [cat.name, cat.slug, cat.description, cat.image]
        );
        categoryIds[cat.slug] = result.insertId;
        console.log(`Inserted category "${cat.name}" with ID: ${result.insertId}`);
      }
    } catch (err) {
      console.error(`Error inserting category ${cat.name}:`, err.message);
    }
  }

  console.log('\nCategory Mapping:', categoryIds);

  // 3. Align and restructure existing products
  console.log('\nRestructuring existing products...');

  // Map of existing products we want to rename, move, and tag
  const existingMapping = [
    {
      oldSlug: 'premium-bhavnagri-nylon-gathiya',
      name: 'Nylon Gathiya',
      slug: 'nylon-gathiya',
      category: 'gathiya',
      tags: 'nylon',
      spiciness: 1
    },
    {
      oldSlug: 'premium-bhavnagri-tikha-gathiya',
      name: 'Tikha Gathiya',
      slug: 'tikha-gathiya',
      category: 'gathiya',
      tags: 'tikha',
      spiciness: 3
    },
    {
      oldSlug: 'premium-bhavnagri-lasaniya-gathiya',
      name: 'Masala Gathiya',
      slug: 'masala-gathiya',
      category: 'gathiya',
      tags: 'masala',
      spiciness: 2
    },
    {
      oldSlug: 'premium-bhavnagri-makhaniya-gathiya',
      name: 'Bhavnagri Gathiya',
      slug: 'bhavnagri-gathiya',
      category: 'gathiya',
      tags: 'bhavnagri',
      spiciness: 1
    },
    {
      oldSlug: 'premium-bhavnagri-special-sev',
      name: 'Nylon Sev',
      slug: 'nylon-sev',
      category: 'sev',
      tags: 'nylon',
      spiciness: 0
    }
  ];

  for (const item of existingMapping) {
    try {
      const catId = categoryIds[item.category];
      if (!catId) continue;

      const [existing] = await pool.query('SELECT id FROM products WHERE slug = ? OR slug = ?', [item.oldSlug, item.slug]);
      if (existing.length > 0) {
        await pool.query(
          'UPDATE products SET category_id = ?, name = ?, slug = ?, tags = ?, spiciness = ? WHERE id = ?',
          [catId, item.name, item.slug, item.tags, item.spiciness, existing[0].id]
        );
        console.log(`Updated and aligned product: "${item.name}" (Slug: ${item.slug})`);
      } else {
        console.log(`Original product slug not found: ${item.oldSlug}`);
      }
    } catch (err) {
      console.error(`Error aligning product ${item.name}:`, err.message);
    }
  }

  // 4. Seed missing products from user requirements
  console.log('\nSeeding missing products...');
  const missingProducts = [
    // Gathiya
    {
      name: 'Fulwadi Gathiya',
      slug: 'fulwadi-gathiya',
      category: 'gathiya',
      tags: 'fulwadi',
      spiciness: 2,
      description: 'Crispy and spiced traditional Gathiya scrolls prepared using age-old kitchen recipes.'
    },
    // Sev
    {
      name: 'Tomato Sev',
      slug: 'tomato-sev',
      category: 'sev',
      tags: 'tomato',
      spiciness: 1,
      description: 'Tangy and crunchy thin Sev seasoned with real dried tomato extracts and standard masalas.'
    },
    {
      name: 'Lasan Sev',
      slug: 'lasan-sev',
      category: 'sev',
      tags: 'lasan',
      spiciness: 2,
      description: 'Authentic garlic-infused thin Sev prepared with fresh lahsun paste for a powerful savory bite.'
    },
    {
      name: 'Ratlami Sev',
      slug: 'ratlami-sev',
      category: 'sev',
      tags: 'ratlami',
      spiciness: 3,
      description: 'Extra spicy Ratlami Sev prepared with ground black pepper, cloves, and premium spices.'
    },
    // Bhujia
    {
      name: 'Garlic Bhujia',
      slug: 'garlic-bhujia',
      category: 'bhujia',
      tags: 'garlic',
      spiciness: 2,
      description: 'Authentic crispy Garlic Bhujia seasoned with hand-made masalas and spicy garlic paste.'
    },
    {
      name: 'Chana Bhujia',
      slug: 'chana-bhujia',
      category: 'bhujia',
      tags: 'chana',
      spiciness: 2,
      description: 'Spicy Bhujia prepared from healthy chana dal flour and special spices.'
    },
    {
      name: 'Aloo Bhujia',
      slug: 'aloo-bhujia',
      category: 'bhujia',
      tags: 'aloo',
      spiciness: 1,
      description: 'Perfect mild crispiness, prepared from mashed potatoes and authentic spices.'
    }
  ];

  for (const item of missingProducts) {
    try {
      const catId = categoryIds[item.category];
      if (!catId) continue;

      const [existing] = await pool.query('SELECT id FROM products WHERE slug = ?', [item.slug]);
      if (existing.length > 0) {
        await pool.query(
          'UPDATE products SET category_id = ?, name = ?, tags = ?, spiciness = ?, description = ? WHERE id = ?',
          [catId, item.name, item.tags, item.spiciness, item.description, existing[0].id]
        );
        console.log(`Product "${item.name}" already exists. Updated details.`);
      } else {
        // Find a default image from existing products to make it look real and beautiful
        const [defaultImage] = await pool.query('SELECT image FROM products WHERE category_id = 1 AND image IS NOT NULL LIMIT 1');
        const img = (defaultImage.length > 0) ? defaultImage[0].image : 'assets/placeholder-luxury.jpg';
        
        await pool.query(
          `INSERT INTO products 
           (category_id, name, slug, description, original_price, selling_price, weight, stock_quantity, image, tags, spiciness, is_featured, is_active) 
           VALUES (?, ?, ?, ?, 150.00, 130.00, '250g', 150, ?, ?, ?, 1, 1)`,
          [catId, item.name, item.slug, item.description, img, item.tags, item.spiciness]
        );
        console.log(`Inserted seeded product: "${item.name}" under category "${item.category}"`);
      }
    } catch (err) {
      console.error(`Error seeding product ${item.name}:`, err.message);
    }
  }

  console.log('\n=== DATABASE RESTRUCTURE COMPLETED ===');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
