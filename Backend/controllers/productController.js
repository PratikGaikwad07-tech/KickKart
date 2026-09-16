const db = require("../config/db");

// ==========================================
// GET ALL PRODUCTS
// ==========================================
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


// ==========================================
// GET SINGLE PRODUCT BY ID
// ==========================================
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


// ==========================================
// CREATE NEW PRODUCT
// ==========================================
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

    // Validate required fields
    if (!category_id || !name || !team || !season || !price) {
      return res.status(400).json({
        message: "Please provide all required fields"
      });
    }

    // Insert product into database
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


// ==========================================
// EXPORT CONTROLLER FUNCTIONS
// ==========================================
module.exports = {
  getProducts,
  getProductById,
  createProduct
};