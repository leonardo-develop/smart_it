const mysql = require("mysql2");
require("dotenv").config();

const requiredVariables = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
    throw new Error(`Missing required database environment variables: ${missingVariables.join(", ")}`);
}

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
db.connect((err) => {
    if (err) {
        console.error("خطأ في الاتصال بالقاعدة:", err);
        return;
    }
    console.log("Smart IT Hub connected successfully");
});

module.exports = db;
