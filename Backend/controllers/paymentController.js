const db = require("../config/db");

// ==========================================
// GET PAYMENT BY ORDER ID
// ==========================================
const getPaymentByOrderId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    // Make sure the order belongs to the logged-in user
    const [orders] = await db.query(
      `SELECT id
       FROM orders
       WHERE id = ? AND user_id = ?`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // Get payment for the order
    const [payments] = await db.query(
      `SELECT
        id,
        order_id,
        payment_method,
        transaction_id,
        amount,
        status,
        created_at
       FROM payments
       WHERE order_id = ?`,
      [orderId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        message: "Payment not found"
      });
    }

    res.status(200).json({
      payment: payments[0]
    });

  } catch (error) {
    console.error("Get payment error:", error);

    res.status(500).json({
      message: "Error fetching payment",
      error: error.message
    });
  }
};

module.exports = {
  getPaymentByOrderId
};