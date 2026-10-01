const db = require("../config/db");

// CREATE ORDER FROM CART
const createOrder = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const userId = req.user.id;
    const { shipping_address, payment_method } = req.body;

    if (!shipping_address) {
      return res.status(400).json({
        message: "Shipping address is required"
      });
    }

    if (!payment_method) {
      return res.status(400).json({
        message: "Payment method is required"
      });
    }

    await connection.beginTransaction();

    // Get user's cart
    const [carts] = await connection.query(
      "SELECT * FROM cart WHERE user_id = ?",
      [userId]
    );

    if (carts.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Cart not found"
      });
    }

    const cart = carts[0];

    // Get cart items with product and stock information
    const [items] = await connection.query(
      `SELECT
        ci.id AS cart_item_id,
        ci.product_id,
        ci.size,
        ci.quantity,
        p.name,
        p.price,
        ps.stock
      FROM cart_items ci
      INNER JOIN products p
        ON ci.product_id = p.id
      INNER JOIN product_sizes ps
        ON ci.product_id = ps.product_id
        AND ci.size = ps.size
      WHERE ci.cart_id = ?
      FOR UPDATE`,
      [cart.id]
    );

    if (items.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        message: "Cart is empty"
      });
    }

    // Validate stock and calculate total
    let totalAmount = 0;

    for (const item of items) {
      if (item.quantity > item.stock) {
        await connection.rollback();

        return res.status(400).json({
          message: `Insufficient stock for ${item.name}, size ${item.size}. Available stock: ${item.stock}`
        });
      }

      totalAmount += Number(item.price) * Number(item.quantity);
    }

    // Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders
       (
         user_id,
         total_amount,
         status,
         payment_status,
         payment_method,
         shipping_address
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        totalAmount,
        "pending",
        "pending",
        payment_method,
        shipping_address
      ]
    );

    const orderId = orderResult.insertId;

    // Create payment record
await connection.query(
    `INSERT INTO payments
     (
       order_id,
       payment_method,
       transaction_id,
       amount,
       status
     )
     VALUES (?, ?, ?, ?, ?)`,
    [
      orderId,
      payment_method,
      null,
      totalAmount,
      "pending"
    ]
  );

  // Create payment record
await connection.query(
    `INSERT INTO payments
     (
       order_id,
       payment_method,
       transaction_id,
       amount,
       status
     )
     VALUES (?, ?, ?, ?, ?)`,
    [
      orderId,
      payment_method,
      null,
      totalAmount,
      "pending"
    ]
  );

    // Create order items and reduce stock
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items
         (
           order_id,
           product_id,
           size,
           quantity,
           price
         )
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.size,
          item.quantity,
          item.price
        ]
      );

      await connection.query(
        `UPDATE product_sizes
         SET stock = stock - ?
         WHERE product_id = ? AND size = ?`,
        [
          item.quantity,
          item.product_id,
          item.size
        ]
      );
    }

    // Clear cart
    await connection.query(
      "DELETE FROM cart_items WHERE cart_id = ?",
      [cart.id]
    );

    await connection.commit();

    res.status(201).json({
      message: "Order created successfully",
      orderId: orderId,
      totalAmount: totalAmount.toFixed(2),
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: payment_method
    });

  } catch (error) {
    await connection.rollback();

    console.error("Create order error:", error);

    res.status(500).json({
      message: "Error creating order",
      error: error.message
    });

  } finally {
    connection.release();
  }
};


// GET USER ORDERS
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await db.query(
      `SELECT
        id,
        total_amount,
        status,
        payment_status,
        payment_method,
        shipping_address,
        created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json(orders);

  } catch (error) {
    console.error("Get orders error:", error);

    res.status(500).json({
      message: "Error fetching orders",
      error: error.message
    });
  }
};


// GET ORDER BY ID
const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [orders] = await db.query(
      `SELECT
        id,
        user_id,
        total_amount,
        status,
        payment_status,
        payment_method,
        shipping_address,
        created_at
      FROM orders
      WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const order = orders[0];

    const [items] = await db.query(
      `SELECT
        oi.id,
        oi.product_id,
        p.name,
        p.image_url,
        oi.size,
        oi.quantity,
        oi.price,
        (oi.price * oi.quantity) AS subtotal
      FROM order_items oi
      INNER JOIN products p
        ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [id]
    );

    res.status(200).json({
      order: order,
      items: items
    });

  } catch (error) {
    console.error("Get order error:", error);

    res.status(500).json({
      message: "Error fetching order",
      error: error.message
    });
  }
};


module.exports = {
  createOrder,
  getMyOrders,
  getOrderById
};