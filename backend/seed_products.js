const db = require('./config/db');

const sampleProducts = [
  {
    name: 'Royal Bhavnagari Gathiya',
    slug: 'royal-bhavnagari-gathiya',
    description: 'The legendary signature snack of Bhavnagar. Light, crispy, and infused with freshly ground black pepper and carom seeds. Hand-crafted using generational techniques.',
    ingredients: 'Chickpea flour (Besan), Groundnut Oil, Ajwain, Black Pepper, Salt',
    original_price: 249,
    selling_price: 199,
    discount_percentage: 20,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
    category_id: 1,
    stock_quantity: 100,
    weight: '500g',
    is_featured: 1
  },
  {
    name: 'Saffron Infused Soan Papdi',
    slug: 'saffron-soan-papdi',
    description: 'Flaky, melt-in-your-mouth layers of sweet perfection, enriched with premium Kashmiri saffron and toasted pistachios. A true heritage delicacy.',
    ingredients: 'Sugar, Gram Flour, All-purpose Flour, Ghee, Saffron, Pistachios',
    original_price: 399,
    selling_price: 349,
    discount_percentage: 12,
    image: 'https://images.unsplash.com/photo-1599577180579-22a89368d5eb?w=800&q=80',
    category_id: 2,
    stock_quantity: 50,
    weight: '400g',
    is_featured: 1
  },
  {
    name: 'Masala Teekhi Sev',
    slug: 'masala-teekhi-sev',
    description: 'A fiery blend of spices and premium chickpea flour. Perfect for adding a crunchy punch to your evening tea or chaat.',
    ingredients: 'Besan, Red Chilli Powder, Cloves, Cardamom, Edible Oil, Salt',
    original_price: 180,
    selling_price: 149,
    discount_percentage: 17,
    image: 'https://images.unsplash.com/photo-1589114471223-fa0812726359?w=800&q=80',
    category_id: 1,
    stock_quantity: 200,
    weight: '250g',
    is_featured: 0
  },
  {
    name: 'Dry Fruit Kaju Katli',
    slug: 'kaju-katli-premium',
    description: 'The gold standard of Indian sweets. Made with 100% premium cashews and pure silver leaf. No added preservatives, just pure excellence.',
    ingredients: 'Premium Cashews, Sugar, Silver Leaf (Chandi Varakh)',
    original_price: 899,
    selling_price: 799,
    discount_percentage: 11,
    image: 'https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?w=800&q=80',
    category_id: 2,
    stock_quantity: 30,
    weight: '500g',
    is_featured: 1
  }
];

async function seed() {
  console.log('--- Starting Heritage Product Seeding ---');
  try {
    for (const product of sampleProducts) {
      // Check if exists
      const [existing] = await db.query('SELECT id FROM products WHERE slug = ?', [product.slug]);
      if (existing.length > 0) {
        console.log(`Skipping ${product.name} (Already exists)`);
        continue;
      }

      await db.query(`
        INSERT INTO products 
        (name, slug, description, ingredients, original_price, selling_price, discount_percentage, image, category_id, stock_quantity, weight, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.name, product.slug, product.description, product.ingredients,
        product.original_price, product.selling_price, product.discount_percentage,
        product.image, product.category_id, product.stock_quantity, product.weight, product.is_featured
      ]);
      console.log(`Established record for: ${product.name}`);
    }
    console.log('--- Seeding Completed Successfully ---');
  } catch (err) {
    console.error('Seeding Failed:', err);
  } finally {
    process.exit();
  }
}

seed();
