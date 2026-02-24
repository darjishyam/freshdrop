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

// User Routes
router.route("/")
    .post(protect, createOrder)
    .get(protect, getUserOrders);

router.put("/:id/cancel", protect, cancelOrder);
router.get("/:id", getOrderById);

// Driver Routes
router.get("/available", protectDriver, getAvailableOrders);
router.post("/:id/accept", protectDriver, acceptOrder);
router.put("/:id/status", protectDriver, updateOrderStatus);

// Restaurant Routes
router.get("/restaurant/:id/active", getRestaurantActiveOrders);
router.put("/:id/restaurant-status", updateRestaurantOrderStatus);

module.exports = router;
