const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        application: "KickKart",
        message: "KickKart API is running",
        status: "OK"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT DATABASE() AS database_name"
        );

        res.json({
            status: "OK",
            message: "MySQL connected successfully",
            database: rows[0].database_name
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            status: "ERROR",
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;
app.get("/test", (req, res) => {
    res.json({
        message: "Server is working"
    });
});
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.listen(PORT, () => {
    console.log(`KickKart API running on port ${PORT}`);
});