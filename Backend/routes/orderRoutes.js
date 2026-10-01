const express = require("express");

const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");


// CREATE ORDER / CHECKOUT
router.post(
  "/",
  authMiddleware,
  createOrder
);


// GET LOGGED-IN USER'S ORDERS
router.get(
  "/",
  authMiddleware,
  getMyOrders
);


// GET ORDER BY ID
router.get(
  "/:id",
  authMiddleware,
  getOrderById
);


module.exports = router;