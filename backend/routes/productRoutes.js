const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

const Restaurant = require("../models/Restaurant");
const { calculateDistance } = require("../utils/geometry");

// @desc    Get featured products (filtered by distance if lat/lon provided)
// @route   GET /api/products/featured
router.get("/featured", async (req, res) => {
    try {
        const { lat, lon, radius = 10 } = req.query; // Default 10km radius

        let query = {};
        let restaurantFilter = { status: 'APPROVED' };

        // 1. Fetch ONLY in-stock products sorted by quality/featured status
        const products = await Product.find({ inStock: true })
            .sort({
                isBestSeller: -1,
                isMustTry: -1,
                rating: -1,
                votes: -1,
                createdAt: -1
            })
            .populate("restaurant");

        let featuredProducts = products.filter(p =>
            p.restaurant &&
            !p.restaurant.externalId &&
            p.restaurant.status === 'APPROVED' &&
            p.restaurant.isOpen !== false  // Also exclude closed restaurants
        );

        // 2. Filter by location if provided
        if (lat && lon) {
            const userLat = parseFloat(lat);
            const userLon = parseFloat(lon);

            featuredProducts = featuredProducts.filter(p => {
                const rLat = p.restaurant.address?.coordinates?.lat;
                const rLon = p.restaurant.address?.coordinates?.lon;
                if (!rLat || !rLon) return false;

                const distance = calculateDistance(userLat, userLon, rLat, rLon);
                return distance <= parseFloat(radius);
            });

            
        }

        res.json(featuredProducts.slice(0, 10)); // Return top 10
    } catch (error) {
        console.error("Error fetching featured products:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
