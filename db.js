const mysql = require("mysql2");

const conexion = mysql.createConnection({
    host: process.env.DB_HOST || "interchange.proxy.rlwy.net",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "nGPLENPYkAuFglrElYCzDqaxUPANQNCj",
    database: process.env.DB_NAME || "railway",
    port: process.env.DB_PORT || 31675
});

conexion.connect(err => {
    if (err) {
        console.log("❌ Error:", err);
    } else {
        console.log("✅ Conectado a MySQL");
    }
});

module.exports = conexion;
