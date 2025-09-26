// const mysql = require("mysql2/promise");
// const dotenv = require("dotenv");
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function dropDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
        });

        await connection.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);
        console.log(`Database '${process.env.DB_NAME}' dropped successfully.`);

        await connection.end();
    } catch (err) {
        console.error("Error dropping DB:", err);
    }
}

// dropDB().then(() => process.exit());
await dropDB();
process.exit();