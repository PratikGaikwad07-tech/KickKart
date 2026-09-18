const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// GET ALL CATEGORIES - Public
router.get("/", getCategories);


// GET CATEGORY BY ID - Public
router.get("/:id", getCategoryById);


// CREATE CATEGORY - Admin Only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createCategory
);


// UPDATE CATEGORY - Admin Only
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateCategory
);


// DELETE CATEGORY - Admin Only
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCategory
);


module.exports = router;