const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

async function run() {
  console.log('Connecting to Live Database:', process.env.DB_HOST);
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [columns] = await db.query('SHOW COLUMNS FROM products');
    console.log('--- PRODUCTS TABLE COLUMNS ---');
    console.log(columns.map(c => `${c.Field}: ${c.Type} (Null: ${c.Null}, Default: ${c.Default})`));

    const [imagesCols] = await db.query('SHOW COLUMNS FROM product_images');
    console.log('--- PRODUCT_IMAGES TABLE COLUMNS ---');
    console.log(imagesCols.map(c => `${c.Field}: ${c.Type}`));

  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await db.end();
  }
}

run();
