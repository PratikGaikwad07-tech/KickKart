
const db = require("../config/db");

// ==========================================
// GET PAYMENT BY ORDER ID
// ==========================================
const getPaymentByOrderId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    // Check whether order belongs to logged-in user
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

    // Get payment
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


// ==========================================
// UPDATE PAYMENT STATUS
// ==========================================
const updatePaymentStatus = async (req, res) => {

  const { orderId } = req.params;
  const { status, transaction_id } = req.body;

  // Allowed statuses
  const allowedStatuses = [
    "pending",
    "success",
    "failed"
  ];

  // Validate status
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid payment status",
      allowedStatuses
    });
  }

  const connection = await db.getConnection();

  try {

    const userId = req.user.id;

    await connection.beginTransaction();

    // ==========================================
    // CHECK ORDER
    // ==========================================
    const [orders] = await connection.query(
      `SELECT id
       FROM orders
       WHERE id = ? AND user_id = ?`,
      [orderId, userId]
    );

    if (orders.length === 0) {

      await connection.rollback();

      return res.status(404).json({
        message: "Order not found"
      });
    }


    // ==========================================
    // CHECK PAYMENT
    // ==========================================
    const [payments] = await connection.query(
      `SELECT id
       FROM payments
       WHERE order_id = ?`,
      [orderId]
    );

    if (payments.length === 0) {

      await connection.rollback();

      return res.status(404).json({
        message: "Payment not found"
      });
    }


    // ==========================================
    // UPDATE PAYMENT
    // ==========================================
    await connection.query(
      `UPDATE payments
       SET status = ?,
           transaction_id = ?
       WHERE order_id = ?`,
      [
        status,
        transaction_id || null,
        orderId
      ]
    );


    // ==========================================
    // UPDATE ORDER PAYMENT STATUS
    // ==========================================
    let orderPaymentStatus = "pending";

    if (status === "success") {
      orderPaymentStatus = "paid";
    }

    if (status === "failed") {
      orderPaymentStatus = "failed";
    }

    await connection.query(
      `UPDATE orders
       SET payment_status = ?
       WHERE id = ? AND user_id = ?`,
      [
        orderPaymentStatus,
        orderId,
        userId
      ]
    );


    // ==========================================
    // COMMIT
    // ==========================================
    await connection.commit();

    res.status(200).json({
      message: "Payment status updated successfully",
      orderId: Number(orderId),
      paymentStatus: orderPaymentStatus,
      paymentStatusInternal: status,
      transactionId: transaction_id || null
    });

  } catch (error) {

    await connection.rollback();

    console.error("Update payment status error:", error);

    res.status(500).json({
      message: "Error updating payment status",
      error: error.message
    });

  } finally {

    connection.release();

  }
};


// ==========================================
// EXPORT
// ==========================================
module.exports = {
  getPaymentByOrderId,
  updatePaymentStatus
};
