const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const credentials = {
    host: 'bqv6zhaewgm8mvtusoi1-mysql.services.clever-cloud.com',
    user: 'u9a4s0c02loyqhbm',
    password: 'xhn7nHlNAzcAiJxwUrKx',
    database: 'bqv6zhaewgm8mvtusoi1',
    multipleStatements: true
  };

  try {
    console.log('Connecting to Clever Cloud MySQL...');
    const conn = await mysql.createConnection(credentials);
    console.log('✅ Connected successfully!');

    console.log('Reading database.sql...');
    let sql = fs.readFileSync(path.join(__dirname, '../database.sql'), 'utf8');

    // Remove the CREATE DATABASE and USE statements from the SQL file
    // to avoid permission errors on Clever Cloud
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS[^;]+;/i, '');
    sql = sql.replace(/USE [^;]+;/i, '');

    console.log('Executing tables creation & seeding...');
    await conn.query(sql);
    console.log('✅ SUCCESS: Database schema imported successfully on Clever Cloud!');

    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ FAILURE during migration:', err.message);
    process.exit(1);
  }
}

migrate();
