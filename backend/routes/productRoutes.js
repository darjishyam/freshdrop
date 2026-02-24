const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// @desc    Get featured products (random sample for now, or use isBestSeller)
// @route   GET /api/products/featured
router.get("/featured", async (req, res) => {
    try {
        // Fetch products and populate restaurant
        // Sort by newest first to be deterministic
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .limit(50) // Fetch more initially to filter
            .populate("restaurant");

        // Filter out products where restaurant is missing or is "external"
        // Assuming user-created restaurants don't have 'externalId' or it's null
        const featuredProducts = products.filter(p => {
            return p.restaurant && !p.restaurant.externalId;
        }).slice(0, 10); // Return top 10

        res.json(featuredProducts);
    } catch (error) {
        console.error("Error fetching featured products:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
