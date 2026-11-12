
const db = require("../config/db");

// ==========================================
// GET PRODUCTS WITH SEARCH, FILTER, SORT
// AND PAGINATION
// ==========================================
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category_id,
      min_price,
      max_price,
      season,
      sort_by = "created_at",
      sort_order = "DESC",
      page = 1,
      limit = 10
    } = req.query;

    const conditions = [];
    const values = [];

    // SEARCH BY PRODUCT NAME OR TEAM
    if (search && search.trim()) {
      conditions.push("(p.name LIKE ? OR p.team LIKE ?)");
      values.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // CATEGORY FILTER
    if (category_id !== undefined) {
      const categoryId = Number(category_id);

      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return res.status(400).json({
          message: "Invalid category_id"
        });
      }

      conditions.push("p.category_id = ?");
      values.push(categoryId);
    }

    // MINIMUM PRICE FILTER
    if (min_price !== undefined) {
      const minPrice = Number(min_price);

      if (!Number.isFinite(minPrice) || minPrice < 0) {
        return res.status(400).json({
          message: "Invalid minimum price"
        });
      }

      conditions.push("p.price >= ?");
      values.push(minPrice);
    }

    // MAXIMUM PRICE FILTER
    if (max_price !== undefined) {
      const maxPrice = Number(max_price);

      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return res.status(400).json({
          message: "Invalid maximum price"
        });
      }

      conditions.push("p.price <= ?");
      values.push(maxPrice);
    }

    // VALIDATE PRICE RANGE
    if (
      min_price !== undefined &&
      max_price !== undefined &&
      Number(min_price) > Number(max_price)
    ) {
      return res.status(400).json({
        message: "Minimum price cannot exceed maximum price"
      });
    }

    // SEASON FILTER
    if (season && season.trim()) {
      conditions.push("p.season = ?");
      values.push(season.trim());
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // SORTING VALIDATION
    const allowedSortColumns = [
      "name",
      "price",
      "created_at"
    ];

    if (!allowedSortColumns.includes(sort_by)) {
      return res.status(400).json({
        message: "Invalid sort_by value"
      });
    }

    const sortDirection = sort_order.toUpperCase();

    if (!["ASC", "DESC"].includes(sortDirection)) {
      return res.status(400).json({
        message: "sort_order must be ASC or DESC"
      });
    }

    // PAGINATION VALIDATION
    const currentPage = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      currentPage < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 50
    ) {
      return res.status(400).json({
        message: "Invalid page or limit. Limit must be between 1 and 50."
      });
    }

    const offset = (currentPage - 1) * pageSize;

    // COUNT MATCHING PRODUCTS
    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total
       FROM products p
       ${whereClause}`,
      values
    );

    const totalProducts = Number(countResult[0].total);

    // FETCH PRODUCTS
    const [products] = await db.query(
      `SELECT p.*
       FROM products p
       ${whereClause}
       ORDER BY p.${sort_by} ${sortDirection}
       LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    res.status(200).json({
      products,
      pagination: {
        currentPage,
        pageSize,
        totalProducts,
        totalPages: Math.ceil(totalProducts / pageSize),
        hasNextPage: currentPage * pageSize < totalProducts,
        hasPreviousPage: currentPage > 1
      }
    });

  } catch (error) {
    console.error("Get products error:", error);

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
    console.error("Get product error:", error);

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

    if (!category_id || !name || !team || !season || price === undefined || price === null) {
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
        description || null,
        image_url || null,
        stock ?? 0
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
// UPDATE PRODUCT
// ==========================================
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

    const [existingProduct] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

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


// GET AVAILABLE SIZES FOR A PRODUCT
const getProductSizes = async (req, res) => {
  try {
    const { id } = req.params;

    // Check whether product exists
    const [products] = await db.query(
      "SELECT id FROM products WHERE id = ?",
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Fetch available sizes and stock
    const [sizes] = await db.query(
      `SELECT size, stock
       FROM product_sizes
       WHERE product_id = ?
       ORDER BY FIELD(size, 'S', 'M', 'L', 'XL', 'XXL')`,
      [id]
    );

    res.status(200).json({
      productId: Number(id),
      sizes
    });

  } catch (error) {
    console.error("Get product sizes error:", error);

    res.status(500).json({
      message: "Error fetching product sizes",
      error: error.message
    });
  }
};

// ==========================================
// DELETE PRODUCT
// ==========================================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [existingProduct] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

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
  getProductSizes,
  createProduct,
  updateProduct,
  deleteProduct
};