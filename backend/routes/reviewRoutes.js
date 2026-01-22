const express = require("express");
const router = express.Router();
const { addReview, getRestaurantReviews } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, addReview);
router.get("/:restaurantId", getRestaurantReviews);

module.exports = router;
