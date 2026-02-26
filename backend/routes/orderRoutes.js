const express = require("express");
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getAvailableOrders,
    acceptOrder,
    updateOrderStatus,
    cancelOrder,
    getRestaurantActiveOrders,
    updateRestaurantOrderStatus,
    getOrderById
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { protect: protectDriver } = require("../middleware/driverAuthMiddleware");
const { protect: protectRestaurant } = require("../middleware/restaurantAuthMiddleware");

// User Routes
router.route("/")
    .post(protect, createOrder)
    .get(protect, getUserOrders);

router.put("/:id/cancel", protect, cancelOrder);
router.get("/:id", protect, getOrderById);
router.get("/detail/:id", getOrderById); // Accessible detail route

// Driver Routes
router.get("/available", protectDriver, getAvailableOrders);
router.post("/:id/accept", protectDriver, acceptOrder);
router.put("/:id/status", protectDriver, updateOrderStatus);

// Restaurant Routes
router.get("/restaurant/:id/active", protectRestaurant, getRestaurantActiveOrders);
router.put("/:id/restaurant-status", protectRestaurant, updateRestaurantOrderStatus);

module.exports = router;
