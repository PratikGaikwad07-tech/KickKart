const db = require("../config/db");

// GET ALL CATEGORIES
const getCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      "SELECT * FROM categories"
    );

    res.status(200).json(categories);

  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      message: "Error fetching categories",
      error: error.message
    });
  }
};


// GET CATEGORY BY ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await db.query(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    res.status(200).json(categories[0]);

  } catch (error) {
    console.error("Get category error:", error);

    res.status(500).json({
      message: "Error fetching category",
      error: error.message
    });
  }
};


// CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Category name is required"
      });
    }

    const [result] = await db.query(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name, description || null]
    );

    res.status(201).json({
      message: "Category created successfully",
      categoryId: result.insertId
    });

  } catch (error) {
    console.error("Create category error:", error);

    res.status(500).json({
      message: "Error creating category",
      error: error.message
    });
  }
};
// UPDATE CATEGORY
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Category name is required"
      });
    }

    const [existingCategory] = await db.query(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );

    if (existingCategory.length === 0) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    await db.query(
      `UPDATE categories
       SET name = ?, description = ?
       WHERE id = ?`,
      [name, description || null, id]
    );

    res.status(200).json({
      message: "Category updated successfully"
    });

  } catch (error) {
    console.error("Update category error:", error);

    res.status(500).json({
      message: "Error updating category",
      error: error.message
    });
  }
};


// DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const [existingCategory] = await db.query(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );

    if (existingCategory.length === 0) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    // Delete category
    await db.query(
      "DELETE FROM categories WHERE id = ?",
      [id]
    );

    res.status(200).json({
      message: "Category deleted successfully"
    });

  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      message: "Error deleting category",
      error: error.message
    });
  }
};


module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};