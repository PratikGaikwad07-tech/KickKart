const express = require("express");

const router = express.Router();

const {
  getPaymentByOrderId
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");

// GET PAYMENT BY ORDER ID
router.get(
  "/order/:orderId",
  authMiddleware,
  getPaymentByOrderId
);

module.exports = router;