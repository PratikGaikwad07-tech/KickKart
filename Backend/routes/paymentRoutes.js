
const express = require("express");

const router = express.Router();

const {
  getPaymentByOrderId,
  updatePaymentStatus
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");


// ==========================================
// GET PAYMENT BY ORDER ID
// ==========================================
router.get(
  "/order/:orderId",
  authMiddleware,
  getPaymentByOrderId
);


// ==========================================
// UPDATE PAYMENT STATUS
// ==========================================
router.put(
  "/order/:orderId",
  authMiddleware,
  updatePaymentStatus
);


module.exports = router;
