const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('Connecting to DB to add spiciness column...');
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Check if column already exists
    const [columns] = await db.query('SHOW COLUMNS FROM products');
    const spicinessExists = columns.some(col => col.Field === 'spiciness');

    if (!spicinessExists) {
      console.log('Adding column "spiciness" to products...');
      await db.query("ALTER TABLE products ADD COLUMN spiciness INT DEFAULT 0");
      console.log('Column "spiciness" added successfully.');
    } else {
      console.log('Column "spiciness" already exists in products table.');
    }

    console.log('Successfully completed database update!');
  } catch (err) {
    console.error('Error modifying table:', err);
  } finally {
    await db.end();
  }
}

run();
