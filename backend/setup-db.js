const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

async function setup() {
    let connection;
    try {
        console.log('Connecting to MySQL...');
        const conn = mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        }).promise();

        console.log(`Creating database: ${process.env.DB_NAME}`);
        await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await conn.query(`USE ${process.env.DB_NAME}`);

        console.log('Reading database.sql...');
        const sql = fs.readFileSync(path.join(__dirname, '../database.sql'), 'utf8');

        console.log('Executing SQL statements...');
        await conn.query(sql);

        console.log('✅ SUCCESS: Database and tables created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ FAILURE:', err.message);
        process.exit(1);
    }
}

setup();
