const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// GET ALL PRODUCTS - Public
router.get("/", getProducts);


// GET SINGLE PRODUCT - Public
router.get("/:id", getProductById);


// CREATE PRODUCT - Admin Only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createProduct
);


// UPDATE PRODUCT - Admin Only
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateProduct
);

// DELETE PRODUCT - Admin Only
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteProduct
);

module.exports = router;