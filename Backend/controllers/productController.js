const db = require("../config/db");

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT * FROM products"
    );

    res.status(200).json(products);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching products",
      error: error.message
    });
  }
};


// GET SINGLE PRODUCT BY ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json(products[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching product",
      error: error.message
    });
  }
};


// CREATE NEW PRODUCT
const createProduct = async (req, res) => {
  try {
    const {
      category_id,
      name,
      team,
      season,
      price,
      description,
      image_url,
      stock
    } = req.body;

    if (!category_id || !name || !team || !season || !price) {
      return res.status(400).json({
        message: "Please provide all required fields"
      });
    }

    const [result] = await db.query(
      `INSERT INTO products
      (category_id, name, team, season, price, description, image_url, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id,
        name,
        team,
        season,
        price,
        description,
        image_url,
        stock || 0
      ]
    );

    res.status(201).json({
      message: "Product created successfully",
      productId: result.insertId
    });

  } catch (error) {
    console.error("Create product error:", error);

    res.status(500).json({
      message: "Error creating product",
      error: error.message
    });
  }
};


// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      category_id,
      name,
      team,
      season,
      price,
      description,
      image_url,
      stock
    } = req.body;

    // Check if product exists
    const [existingProduct] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Update product
    await db.query(
      `UPDATE products
       SET category_id = ?,
           name = ?,
           team = ?,
           season = ?,
           price = ?,
           description = ?,
           image_url = ?,
           stock = ?
       WHERE id = ?`,
      [
        category_id,
        name,
        team,
        season,
        price,
        description,
        image_url,
        stock,
        id
      ]
    );

    res.status(200).json({
      message: "Product updated successfully"
    });

  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      message: "Error updating product",
      error: error.message
    });
  }
};


// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [existingProduct] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Delete product
    await db.query(
      "DELETE FROM products WHERE id = ?",
      [id]
    );

    res.status(200).json({
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      message: "Error deleting product",
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};