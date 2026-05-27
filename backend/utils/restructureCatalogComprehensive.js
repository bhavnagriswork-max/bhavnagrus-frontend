const pool = require('../config/db');

async function run() {
  console.log('=== COMPREHENSIVE DATABASE RESTRUCTURE ===');

  // 1. Define active categories
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
    },
    {
      name: 'Puri & Papadi',
      slug: 'puri-papadi',
      description: 'Crispy hand-crafted Puris and paper-thin flaky Papadi wafers, perfectly spiced for high tea.',
      image: 'assets/placeholder-luxury.jpg'
    },
    {
      name: 'Mixture & Chevdo',
      slug: 'mixture-chevdo',
      description: 'Exquisite blended savory mixtures, dry Bhakharvadi, stuffed Kachori, and sweet-tangy Makai Chevdo.',
      image: 'assets/placeholder-luxury.jpg'
    },
    {
      name: 'Chana & Peanuts',
      slug: 'chana-peanuts',
      description: 'Spiced roasted Chana dal, protein-rich Moong dal, and crispy peanuts coated in standard masalas.',
      image: 'assets/placeholder-luxury.jpg'
    }
  ];

  const categoryIds = {};

  // Insert or Update active categories
  for (const cat of categories) {
    try {
      const [existing] = await pool.query('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
      if (existing.length > 0) {
        categoryIds[cat.slug] = existing[0].id;
        await pool.query(
          'UPDATE categories SET name = ?, description = ?, is_active = 1 WHERE id = ?',
          [cat.name, cat.description, existing[0].id]
        );
        console.log(`Category "${cat.name}" updated with ID: ${existing[0].id}`);
      } else {
        const [result] = await pool.query(
          'INSERT INTO categories (name, slug, description, image, is_active) VALUES (?, ?, ?, ?, 1)',
          [cat.name, cat.slug, cat.description, cat.image]
        );
        categoryIds[cat.slug] = result.insertId;
        console.log(`Category "${cat.name}" inserted with ID: ${result.insertId}`);
      }
    } catch (err) {
      console.error(`Error processing category ${cat.name}:`, err.message);
    }
  }

  // Deactivate old legacy "Snacks" category (ID 1) so it won't be visible in main navigation
  try {
    await pool.query('UPDATE categories SET is_active = 0 WHERE id = 1');
    console.log('Legacy category "Snacks" (ID 1) deactivated successfully.');
  } catch (err) {
    console.error('Error deactivating legacy category:', err.message);
  }

  console.log('\nActive Categories Map:', categoryIds);

  // 2. Map all 31 products strictly
  const productMappings = [
    // Gathiya (6)
    { id: 9, catSlug: 'gathiya', name: 'Masala Gathiya', slug: 'masala-gathiya', tags: 'masala', spiciness: 2 },
    { id: 11, catSlug: 'gathiya', name: 'Bhavnagri Gathiya', slug: 'bhavnagri-gathiya', tags: 'bhavnagri', spiciness: 1 },
    { id: 13, catSlug: 'gathiya', name: 'Nylon Gathiya', slug: 'nylon-gathiya', tags: 'nylon', spiciness: 1 },
    { id: 19, catSlug: 'gathiya', name: 'Tikha Gathiya', slug: 'tikha-gathiya', tags: 'tikha', spiciness: 3 },
    { id: 25, catSlug: 'gathiya', name: 'Fulwadi Gathiya', slug: 'fulwadi-gathiya', tags: 'fulwadi', spiciness: 2 },
    { id: 12, catSlug: 'gathiya', name: 'Mari Gathiya', slug: 'mari-gathiya', tags: 'mari', spiciness: 2, description: 'Crispy black-pepper spiced traditional Gathiya noodles.' },

    // Sev (7)
    { id: 17, catSlug: 'sev', name: 'Nylon Sev', slug: 'nylon-sev', tags: 'nylon', spiciness: 0 },
    { id: 26, catSlug: 'sev', name: 'Tomato Sev', slug: 'tomato-sev', tags: 'tomato', spiciness: 1 },
    { id: 27, catSlug: 'sev', name: 'Lasan Sev', slug: 'lasan-sev', tags: 'lasan', spiciness: 2 },
    { id: 28, catSlug: 'sev', name: 'Ratlami Sev', slug: 'ratlami-sev', tags: 'ratlami', spiciness: 3 },

    // Bhujia (8)
    { id: 29, catSlug: 'bhujia', name: 'Garlic Bhujia', slug: 'garlic-bhujia', tags: 'garlic', spiciness: 2 },
    { id: 30, catSlug: 'bhujia', name: 'Chana Bhujia', slug: 'chana-bhujia', tags: 'chana', spiciness: 2 },
    { id: 31, catSlug: 'bhujia', name: 'Aloo Bhujia', slug: 'aloo-bhujia', tags: 'aloo', spiciness: 1 },

    // Puri & Papadi
    { id: 15, catSlug: 'puri-papadi', name: 'Pizza Puri', slug: 'pizza-puri', tags: 'pizza', spiciness: 1 },
    { id: 21, catSlug: 'puri-papadi', name: 'Magic Puri', slug: 'magic-puri', tags: 'magic', spiciness: 1 },
    { id: 20, catSlug: 'puri-papadi', name: 'Til Papdi', slug: 'til-papdi', tags: 'til', spiciness: 0 },
    { id: 23, catSlug: 'puri-papadi', name: 'Nylon Papadi', slug: 'nylon-papadi', tags: 'nylon', spiciness: 0 },
    { id: 2, catSlug: 'puri-papadi', name: 'Chakri', slug: 'chakri', tags: 'chakri', spiciness: 1 },

    // Mixture & Chevdo
    { id: 1, catSlug: 'mixture-chevdo', name: 'Bhakharvadi', slug: 'bhakharvadi', tags: 'bhakharvadi', spiciness: 1 },
    { id: 10, catSlug: 'mixture-chevdo', name: 'Makai Chevdo', slug: 'makai-chevdo', tags: 'makai', spiciness: 1 },
    { id: 14, catSlug: 'mixture-chevdo', name: 'Papad Chevdo', slug: 'papad-chevdo', tags: 'papad', spiciness: 1 },
    { id: 24, catSlug: 'mixture-chevdo', name: 'Jhal Muri', slug: 'jhal-muri', tags: 'jhal', spiciness: 2 },
    { id: 22, catSlug: 'mixture-chevdo', name: 'Mix Kathol', slug: 'mix-kathol', tags: 'kathol', spiciness: 2 },
    { id: 5, catSlug: 'mixture-chevdo', name: 'Dry Kachori', slug: 'dry-kachori', tags: 'kachori', spiciness: 1 },

    // Chana & Peanuts
    { id: 4, catSlug: 'chana-peanuts', name: 'Cheese Peanuts', slug: 'cheese-peanuts', tags: 'cheese', spiciness: 1 },
    { id: 16, catSlug: 'chana-peanuts', name: 'Salted Peanuts', slug: 'salted-peanuts', tags: 'salted', spiciness: 0 },
    { id: 18, catSlug: 'chana-peanuts', name: 'Chatpata Peanuts', slug: 'chatpata-peanuts', tags: 'chatpata', spiciness: 1 },
    { id: 8, catSlug: 'chana-peanuts', name: 'Hing Jeera Chana', slug: 'hing-jeera-chana', tags: 'hing', spiciness: 1 },
    { id: 3, catSlug: 'chana-peanuts', name: 'Chana Bhajiya', slug: 'chana-bhajiya', tags: 'chana', spiciness: 2 },
    { id: 7, catSlug: 'chana-peanuts', name: 'Garlic Chana Bhajiya', slug: 'garlic-chana-bhajiya', tags: 'garlic', spiciness: 2 },
    { id: 6, catSlug: 'chana-peanuts', name: 'Fried Moong', slug: 'fried-moong', tags: 'moong', spiciness: 0 }
  ];

  console.log('\nUpdating product assignments strictly...');
  
  for (const item of productMappings) {
    try {
      const categoryId = categoryIds[item.catSlug];
      if (!categoryId) {
        console.error(`Error: Category ID for slug ${item.catSlug} not found.`);
        continue;
      }

      if (item.description) {
        await pool.query(
          `UPDATE products 
           SET category_id = ?, name = ?, slug = ?, tags = ?, spiciness = ?, description = ? 
           WHERE id = ?`,
          [categoryId, item.name, item.slug, item.tags, item.spiciness, item.description, item.id]
        );
      } else {
        await pool.query(
          `UPDATE products 
           SET category_id = ?, name = ?, slug = ?, tags = ?, spiciness = ? 
           WHERE id = ?`,
          [categoryId, item.name, item.slug, item.tags, item.spiciness, item.id]
        );
      }

      console.log(`Aligned product ID ${item.id} -> "${item.name}" in category "${item.catSlug}"`);
    } catch (err) {
      console.error(`Error updating product ID ${item.id}:`, err.message);
    }
  }

  console.log('\nRestructuring completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
