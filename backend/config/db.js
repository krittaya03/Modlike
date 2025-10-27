// config/db.js
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

let db;

const connectDB = async () => {
  if (db) return db; // ถ้าเชื่อมแล้ว return เลย
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    console.log("✓ Database connected");
    return db;
  } catch (err) {
    console.error("✗ Database connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
