const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function connectDB() {
    try {

        const connection = await pool.getConnection();

        console.log("======================================");
        console.log("✅ MySQL Connected Successfully");
        console.log(`📦 Database : ${process.env.DB_NAME}`);
        console.log(`🌍 Host     : ${process.env.DB_HOST}`);
        console.log(`🚪 Port     : ${process.env.DB_PORT}`);
        console.log("======================================");

        connection.release();

    } catch (error) {

        console.log("======================================");
        console.log("❌ Database Connection Failed");
        console.error(error.message);
        console.log("======================================");

        process.exit(1);

    }
}

module.exports = {
    pool,
    connectDB
};