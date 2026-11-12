
const db = require("../config/db");

// ==========================================
// ADD PRODUCT REVIEW
// ==========================================
const addReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, rating, comment } = req.body;

        // Validate product ID
        if (
            !Number.isInteger(Number(product_id)) ||
            Number(product_id) <= 0
        ) {
            return res.status(400).json({
                message: "A valid product_id is required"
            });
        }

        // Validate rating
        if (
            !Number.isInteger(Number(rating)) ||
            Number(rating) < 1 ||
            Number(rating) > 5
        ) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5"
            });
        }

        // Validate comment
        if (
            comment !== undefined &&
            comment !== null &&
            typeof comment !== "string"
        ) {
            return res.status(400).json({
                message: "Comment must be a string"
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

        // Check whether user already reviewed this product
        const [existingReviews] = await db.query(
            `SELECT id FROM reviews
             WHERE user_id = ? AND product_id = ?`,
            [userId, product_id]
        );

        if (existingReviews.length > 0) {
            return res.status(409).json({
                message: "You have already reviewed this product. Update your existing review instead."
            });
        }

        // Insert review
        const [result] = await db.query(
            `INSERT INTO reviews
             (user_id, product_id, rating, comment)
             VALUES (?, ?, ?, ?)`,
            [
                userId,
                product_id,
                Number(rating),
                comment ? comment.trim() : null
            ]
        );

        res.status(201).json({
            message: "Review added successfully",
            reviewId: result.insertId
        });

    } catch (error) {
        console.error("Add review error:", error);

        // Handles simultaneous duplicate submissions
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "You have already reviewed this product"
            });
        }

        res.status(500).json({
            message: "Error adding review"
        });
    }
};


// ==========================================
// GET REVIEWS FOR A PRODUCT
// ==========================================
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        if (
            !Number.isInteger(Number(productId)) ||
            Number(productId) <= 0
        ) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        // Check whether product exists
        const [products] = await db.query(
            "SELECT id, name FROM products WHERE id = ?",
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Fetch product reviews
        const [reviews] = await db.query(
            `SELECT
                r.id AS review_id,
                r.rating,
                r.comment,
                r.created_at,
                r.updated_at,
                u.id AS user_id,
                u.name AS customer_name
             FROM reviews r
             INNER JOIN users u
                ON r.user_id = u.id
             WHERE r.product_id = ?
             ORDER BY r.created_at DESC`,
            [productId]
        );

        // Calculate average rating
        const [ratingResult] = await db.query(
            `SELECT
                COUNT(*) AS totalReviews,
                COALESCE(ROUND(AVG(rating), 1), 0) AS averageRating
             FROM reviews
             WHERE product_id = ?`,
            [productId]
        );

        res.status(200).json({
            product: products[0],
            totalReviews: Number(ratingResult[0].totalReviews),
            averageRating: Number(ratingResult[0].averageRating),
            reviews
        });

    } catch (error) {
        console.error("Get product reviews error:", error);

        res.status(500).json({
            message: "Error fetching product reviews"
        });
    }
};


// ==========================================
// UPDATE OWN REVIEW
// ==========================================
const updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        if (
            !Number.isInteger(Number(reviewId)) ||
            Number(reviewId) <= 0
        ) {
            return res.status(400).json({
                message: "Invalid review ID"
            });
        }

        if (
            rating === undefined &&
            comment === undefined
        ) {
            return res.status(400).json({
                message: "Provide a rating or comment to update"
            });
        }

        if (
            rating !== undefined &&
            (
                !Number.isInteger(Number(rating)) ||
                Number(rating) < 1 ||
                Number(rating) > 5
            )
        ) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5"
            });
        }

        if (
            comment !== undefined &&
            comment !== null &&
            typeof comment !== "string"
        ) {
            return res.status(400).json({
                message: "Comment must be a string"
            });
        }

        // Find review belonging to logged-in user
        const [existingReviews] = await db.query(
            `SELECT * FROM reviews
             WHERE id = ? AND user_id = ?`,
            [reviewId, userId]
        );

        if (existingReviews.length === 0) {
            return res.status(404).json({
                message: "Review not found"
            });
        }

        const existingReview = existingReviews[0];

        const newRating =
            rating === undefined
                ? existingReview.rating
                : Number(rating);

        const newComment =
            comment === undefined
                ? existingReview.comment
                : (comment === null ? null : comment.trim());

        await db.query(
            `UPDATE reviews
             SET rating = ?, comment = ?
             WHERE id = ? AND user_id = ?`,
            [newRating, newComment, reviewId, userId]
        );

        res.status(200).json({
            message: "Review updated successfully"
        });

    } catch (error) {
        console.error("Update review error:", error);

        res.status(500).json({
            message: "Error updating review"
        });
    }
};


// ==========================================
// DELETE OWN REVIEW
// ==========================================
const deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reviewId } = req.params;

        if (
            !Number.isInteger(Number(reviewId)) ||
            Number(reviewId) <= 0
        ) {
            return res.status(400).json({
                message: "Invalid review ID"
            });
        }

        const [result] = await db.query(
            `DELETE FROM reviews
             WHERE id = ? AND user_id = ?`,
            [reviewId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Review not found"
            });
        }

        res.status(200).json({
            message: "Review deleted successfully"
        });

    } catch (error) {
        console.error("Delete review error:", error);

        res.status(500).json({
            message: "Error deleting review"
        });
    }
};


module.exports = {
    addReview,
    getProductReviews,
    updateReview,
    deleteReview
};
