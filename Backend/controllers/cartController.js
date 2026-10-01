const db = require("../config/db");

// GET OR CREATE CART FOR LOGGED-IN USER
const getOrCreateCart = async (userId) => {
  const [carts] = await db.query(
    "SELECT * FROM cart WHERE user_id = ?",
    [userId]
  );

  if (carts.length > 0) {
    return carts[0];
  }

  const [result] = await db.query(
    "INSERT INTO cart (user_id) VALUES (?)",
    [userId]
  );

  return {
    id: result.insertId,
    user_id: userId
  };
};


// CREATE / GET CART
const createCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await getOrCreateCart(userId);

    res.status(200).json({
      message: "Cart ready",
      cartId: cart.id
    });

  } catch (error) {
    console.error("Create cart error:", error);

    res.status(500).json({
      message: "Error creating cart",
      error: error.message
    });
  }
};


// GET CART WITH ITEMS
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await getOrCreateCart(userId);

    const [items] = await db.query(
      `SELECT
        ci.id,
        ci.product_id,
        p.name,
        p.team,
        p.season,
        p.price,
        p.image_url,
        ci.size,
        ci.quantity,
        (p.price * ci.quantity) AS subtotal
      FROM cart_items ci
      INNER JOIN products p
        ON ci.product_id = p.id
      WHERE ci.cart_id = ?
      ORDER BY ci.id DESC`,
      [cart.id]
    );

    let total = 0;

    items.forEach((item) => {
      total += Number(item.subtotal);
    });

    res.status(200).json({
      cartId: cart.id,
      userId: userId,
      items: items,
      total: total.toFixed(2)
    });

  } catch (error) {
    console.error("Get cart error:", error);

    res.status(500).json({
      message: "Error fetching cart",
      error: error.message
    });
  }
};


// ADD ITEM TO CART
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, size, quantity } = req.body;

    if (!product_id || !size || !quantity) {
      return res.status(400).json({
        message: "product_id, size and quantity are required"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0"
      });
    }

    // Check product
    const [products] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Check size and stock
    const [sizes] = await db.query(
      `SELECT * FROM product_sizes
       WHERE product_id = ? AND size = ?`,
      [product_id, size]
    );

    if (sizes.length === 0) {
      return res.status(404).json({
        message: "Selected size is not available for this product"
      });
    }

    const availableStock = sizes[0].stock;

    if (quantity > availableStock) {
      return res.status(400).json({
        message: `Only ${availableStock} item(s) available for size ${size}`
      });
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Check if same product + size already exists
    const [existingItems] = await db.query(
      `SELECT * FROM cart_items
       WHERE cart_id = ? AND product_id = ? AND size = ?`,
      [cart.id, product_id, size]
    );

    if (existingItems.length > 0) {
      const newQuantity =
        existingItems[0].quantity + Number(quantity);

      if (newQuantity > availableStock) {
        return res.status(400).json({
          message: `Only ${availableStock} item(s) available for size ${size}`
        });
      }

      await db.query(
        `UPDATE cart_items
         SET quantity = ?
         WHERE id = ?`,
        [newQuantity, existingItems[0].id]
      );

      return res.status(200).json({
        message: "Cart item quantity updated",
        cartItemId: existingItems[0].id,
        quantity: newQuantity
      });
    }

    // Add new item
    const [result] = await db.query(
      `INSERT INTO cart_items
       (cart_id, product_id, size, quantity)
       VALUES (?, ?, ?, ?)`,
      [cart.id, product_id, size, quantity]
    );

    res.status(201).json({
      message: "Product added to cart",
      cartItemId: result.insertId
    });

  } catch (error) {
    console.error("Add to cart error:", error);

    res.status(500).json({
      message: "Error adding product to cart",
      error: error.message
    });
  }
};


// UPDATE CART ITEM
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0"
      });
    }

    // Find cart item belonging to logged-in user
    const [items] = await db.query(
      `SELECT
        ci.*,
        c.user_id
       FROM cart_items ci
       INNER JOIN cart c
         ON ci.cart_id = c.id
       WHERE ci.id = ? AND c.user_id = ?`,
      [id, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        message: "Cart item not found"
      });
    }

    const item = items[0];

    // Check stock for selected size
    const [sizes] = await db.query(
      `SELECT stock
       FROM product_sizes
       WHERE product_id = ? AND size = ?`,
      [item.product_id, item.size]
    );

    if (sizes.length === 0) {
      return res.status(404).json({
        message: "Selected size is no longer available"
      });
    }

    if (quantity > sizes[0].stock) {
      return res.status(400).json({
        message: `Only ${sizes[0].stock} item(s) available for size ${item.size}`
      });
    }

    await db.query(
      `UPDATE cart_items
       SET quantity = ?
       WHERE id = ?`,
      [quantity, id]
    );

    res.status(200).json({
      message: "Cart item updated successfully"
    });

  } catch (error) {
    console.error("Update cart item error:", error);

    res.status(500).json({
      message: "Error updating cart item",
      error: error.message
    });
  }
};


// DELETE CART ITEM
const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Make sure item belongs to logged-in user's cart
    const [items] = await db.query(
      `SELECT ci.id
       FROM cart_items ci
       INNER JOIN cart c
         ON ci.cart_id = c.id
       WHERE ci.id = ? AND c.user_id = ?`,
      [id, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        message: "Cart item not found"
      });
    }

    await db.query(
      "DELETE FROM cart_items WHERE id = ?",
      [id]
    );

    res.status(200).json({
      message: "Cart item removed successfully"
    });

  } catch (error) {
    console.error("Delete cart item error:", error);

    res.status(500).json({
      message: "Error removing cart item",
      error: error.message
    });
  }
};


module.exports = {
  createCart,
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem
};