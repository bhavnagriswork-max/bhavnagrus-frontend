const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('Connecting to DB to add brand column...');
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Check if column already exists
    const [columns] = await db.query('SHOW COLUMNS FROM products');
    const brandExists = columns.some(col => col.Field === 'brand');

    if (!brandExists) {
      console.log('Adding column "brand" to products...');
      await db.query("ALTER TABLE products ADD COLUMN brand VARCHAR(255) DEFAULT 'Bhavnagris'");
      console.log('Column "brand" added successfully.');
    } else {
      console.log('Column "brand" already exists in products table.');
    }

    // Now, update brand names based on category
    // Let's get all categories first
    const [categories] = await db.query('SELECT id, name FROM categories');
    console.log('Categories found:', categories);

    for (const cat of categories) {
      const catNameLower = cat.name.toLowerCase();
      if (catNameLower.includes('perfumes') || catNameLower.includes('puja') || catNameLower.includes('essential')) {
        console.log(`Setting brand for category "${cat.name}" products to "Heritage Imports"...`);
        await db.query('UPDATE products SET brand = ? WHERE category_id = ?', ['Heritage Imports', cat.id]);
      } else {
        console.log(`Setting brand for category "${cat.name}" products to "Bhavnagris"...`);
        await db.query('UPDATE products SET brand = ? WHERE category_id = ?', ['Bhavnagris', cat.id]);
      }
    }

    console.log('Successfully completed database update!');
  } catch (err) {
    console.error('Error modifying table:', err);
  } finally {
    await db.end();
  }
}

run();
