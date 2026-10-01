const express = require("express");

const router = express.Router();

const {
  createCart,
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem
} = require("../controllers/cartController");

const authMiddleware = require("../middleware/authMiddleware");


// CREATE / GET CART
router.post(
  "/",
  authMiddleware,
  createCart
);


// GET CART WITH ITEMS
router.get(
  "/",
  authMiddleware,
  getCart
);


// ADD PRODUCT TO CART
router.post(
  "/items",
  authMiddleware,
  addToCart
);


// UPDATE CART ITEM
router.put(
  "/items/:id",
  authMiddleware,
  updateCartItem
);


// DELETE CART ITEM
router.delete(
  "/items/:id",
  authMiddleware,
  deleteCartItem
);


module.exports = router;