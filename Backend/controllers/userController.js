const db = require("../config/db");
const bcrypt = require("bcrypt");

// ==========================================
// GET ALL USERS
// ==========================================
exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, email, role, created_at FROM users"
        );

        res.json({
            status: "ok",
            users: users
        });

    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch users"
        });
    }
};


// ==========================================
// CREATE NEW USER
// ==========================================
exports.createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Name, email and password are required"
            });
        }

        // Check if email already exists
        const [existingUser] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                status: "error",
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into database
        const [result] = await db.query(
            `INSERT INTO users 
            (name, email, password, role) 
            VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, "customer"]
        );

        // Send response
        res.status(201).json({
            status: "ok",
            message: "User registered successfully",
            user: {
                id: result.insertId,
                name: name,
                email: email,
                role: "customer"
            }
        });

    } catch (error) {
        console.error("Create user error:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to create user"
        });
    }
};


// ==========================================
// GET USER BY ID
// ==========================================
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.query(
            `SELECT id, name, email, role, created_at 
             FROM users 
             WHERE id = ?`,
            [id]
        );

        // User not found
        if (users.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        res.json({
            status: "ok",
            user: users[0]
        });

    } catch (error) {
        console.error("Get user by ID error:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch user"
        });
    }
};