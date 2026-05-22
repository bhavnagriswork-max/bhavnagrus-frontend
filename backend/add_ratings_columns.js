const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('Connecting to DB to add rating and rating_count columns...');
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Check columns
    const [columns] = await db.query('SHOW COLUMNS FROM products');
    
    const ratingExists = columns.some(col => col.Field === 'rating');
    const ratingCountExists = columns.some(col => col.Field === 'rating_count');

    if (!ratingExists) {
      console.log('Adding column "rating" to products...');
      await db.query("ALTER TABLE products ADD COLUMN rating DECIMAL(3, 1) DEFAULT 4.8");
      console.log('Column "rating" added successfully.');
    } else {
      console.log('Column "rating" already exists.');
    }

    if (!ratingCountExists) {
      console.log('Adding column "rating_count" to products...');
      await db.query("ALTER TABLE products ADD COLUMN rating_count INT DEFAULT 120");
      console.log('Column "rating_count" added successfully.');
    } else {
      console.log('Column "rating_count" already exists.');
    }

    console.log('Successfully completed rating database update!');
  } catch (err) {
    console.error('Error modifying table:', err);
  } finally {
    await db.end();
  }
}

run();
