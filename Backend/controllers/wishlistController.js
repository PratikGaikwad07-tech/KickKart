
const db = require("../config/db");

// ==========================================
// ADD PRODUCT TO WISHLIST
// ==========================================
const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id } = req.body;

        // Validate product ID
        if (!product_id || !Number.isInteger(Number(product_id)) || Number(product_id) <= 0) {
            return res.status(400).json({
                message: "A valid product_id is required"
            });
        }

        // Check whether product exists
        const [products] = await db.query(
            "SELECT id FROM products WHERE id = ?",
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Insert product into wishlist
        const [result] = await db.query(
            `INSERT IGNORE INTO wishlist (user_id, product_id)
             VALUES (?, ?)`,
            [userId, product_id]
        );

        if (result.affectedRows === 0) {
            return res.status(200).json({
                message: "Product is already in your wishlist"
            });
        }

        res.status(201).json({
            message: "Product added to wishlist successfully",
            wishlistId: result.insertId,
            productId: Number(product_id)
        });

    } catch (error) {
        console.error("Add to wishlist error:", error);

        res.status(500).json({
            message: "Error adding product to wishlist"
        });
    }
};


// ==========================================
// GET USER WISHLIST
// ==========================================
const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        const [items] = await db.query(
            `SELECT
                w.id AS wishlist_id,
                p.id AS product_id,
                p.name,
                p.team,
                p.season,
                p.price,
                p.image_url,
                p.stock,
                w.created_at
             FROM wishlist w
             INNER JOIN products p
                ON w.product_id = p.id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC`,
            [userId]
        );

        res.status(200).json({
            message: "Wishlist fetched successfully",
            totalItems: items.length,
            items
        });

    } catch (error) {
        console.error("Get wishlist error:", error);

        res.status(500).json({
            message: "Error fetching wishlist"
        });
    }
};


// ==========================================
// REMOVE PRODUCT FROM WISHLIST
// ==========================================
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        if (!Number.isInteger(Number(productId)) || Number(productId) <= 0) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const [result] = await db.query(
            `DELETE FROM wishlist
             WHERE user_id = ? AND product_id = ?`,
            [userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found in your wishlist"
            });
        }

        res.status(200).json({
            message: "Product removed from wishlist successfully"
        });

    } catch (error) {
        console.error("Remove from wishlist error:", error);

        res.status(500).json({
            message: "Error removing product from wishlist"
        });
    }
};


module.exports = {
    addToWishlist,
    getWishlist,
    removeFromWishlist
};
