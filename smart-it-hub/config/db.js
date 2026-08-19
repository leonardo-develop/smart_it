const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "smart_it_hub"
});
db.connect((err) => {
    if (err) {
        console.error("خطأ في الاتصال بالقاعدة:", err);
        return;
    }
    console.log("Smart IT Hub connected successfully");
});

module.exports = db;
