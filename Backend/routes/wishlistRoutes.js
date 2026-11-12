
const express = require("express");
const router = express.Router();

const {
    addToWishlist,
    getWishlist,
    removeFromWishlist
} = require("../controllers/wishlistController");

const authMiddleware = require("../middleware/authMiddleware");

// GET LOGGED-IN USER'S WISHLIST
router.get(
    "/",
    authMiddleware,
    getWishlist
);

// ADD PRODUCT TO WISHLIST
router.post(
    "/",
    authMiddleware,
    addToWishlist
);

// REMOVE PRODUCT FROM WISHLIST
router.delete(
    "/:productId",
    authMiddleware,
    removeFromWishlist
);

module.exports = router;
