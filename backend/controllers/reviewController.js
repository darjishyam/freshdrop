const Review = require("../models/Review");
const Restaurant = require("../models/Restaurant");

// @desc    Add a review
// @route   POST /api/reviews
// @access  Private
// @desc    Add a review
// @route   POST /api/reviews
// @access  Private
const addReview = async (req, res) => {
    try {
        const { restaurantId, productId, productName, rating, comment, userName, userImage } = req.body;
        const userId = req.user.id;

        if (!restaurantId || !rating || !comment) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Check if productId is a valid ObjectId
        const isValidProductId = productId && /^[0-9a-fA-F]{24}$/.test(productId);

        // Create review
        const review = await Review.create({
            user: userId,
            restaurant: restaurantId,
            product: isValidProductId ? productId : null, // Set null if not valid ObjectId
            productName: productName, // Save the name (or mock ID) for filtering
            rating,
            comment,
            userName: userName || req.user.name,
            userImage: userImage || req.user.image,
        });

        // Update Restaurant Rating only if it's a valid real restaurant
        // Skip for placeholder dummy ID
        if (restaurantId !== "000000000000000000000001") {
            try {
                const reviews = await Review.find({ restaurant: restaurantId });
                const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
                const avgRating = (totalRating / reviews.length).toFixed(1);

                await Restaurant.findByIdAndUpdate(restaurantId, {
                    rating: avgRating,
                    ratingCount: reviews.length,
                });
            } catch (err) {
                console.log("Skipping restaurant update (likely mock ID):", err.message);
            }
        }

        res.status(201).json(review);
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get reviews for a restaurant
// @route   GET /api/reviews/:restaurantId
// @access  Public
// @desc    Get reviews for a restaurant
// @route   GET /api/reviews/:restaurantId
// @access  Public
const getRestaurantReviews = async (req, res) => {
    try {
        let { restaurantId } = req.params;

        // Check if restaurantId is a valid ObjectId (24 hex characters)
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(restaurantId);

        if (!isValidObjectId) {
            // If invalid ID (like "1"), map to our placeholder ID
            restaurantId = "000000000000000000000001";
        }

        const reviews = await Review.find({ restaurant: restaurantId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    addReview,
    getRestaurantReviews,
};
