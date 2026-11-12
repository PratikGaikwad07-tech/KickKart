
const express = require("express");
const router = express.Router();

const {
    addReview,
    getProductReviews,
    updateReview,
    deleteReview
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");

// GET REVIEWS FOR A PRODUCT - Public
router.get(
    "/product/:productId",
    getProductReviews
);

// ADD REVIEW - Logged-in User
router.post(
    "/",
    authMiddleware,
    addReview
);

// UPDATE OWN REVIEW - Logged-in User
router.put(
    "/:reviewId",
    authMiddleware,
    updateReview
);

// DELETE OWN REVIEW - Logged-in User
router.delete(
    "/:reviewId",
    authMiddleware,
    deleteReview
);

module.exports = router;
