const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// ==========================================
// GET ALL PRODUCTS - Public
// ==========================================
router.get("/", getProducts);


// ==========================================
// GET SINGLE PRODUCT - Public
// ==========================================
router.get("/:id", getProductById);


// ==========================================
// CREATE NEW PRODUCT - Admin Only
// ==========================================
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createProduct
);


module.exports = router;