const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getUsers,
    getUserById,
    createUser
} = require("../controllers/userController");

// Get all users - ADMIN ONLY
router.get("/", authMiddleware, authorizeRoles("admin"), getUsers);

// Create new user - PUBLIC
router.post("/", createUser);

// Get user by ID - LOGGED IN USERS
router.get("/:id", authMiddleware, getUserById);

module.exports = router;