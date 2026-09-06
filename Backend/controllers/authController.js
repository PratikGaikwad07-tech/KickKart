const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ==========================================
// LOGIN USER
// ==========================================
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Email and password are required"
            });
        }

        // Find user by email
        const [users] = await db.query(
            "SELECT id, name, email, password, role FROM users WHERE email = ?",
            [email]
        );

        // User doesn't exist
        if (users.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        // Password incorrect
        if (!passwordMatch) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password"
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Login successful
        res.json({
            status: "ok",
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            status: "error",
            message: "Login failed"
        });
    }
};