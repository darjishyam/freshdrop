const express = require("express");
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getAvailableOrders,
    acceptOrder,
    updateOrderStatus
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { protect: protectDriver } = require("../middleware/driverAuthMiddleware");

// User Routes
router.route("/")
    .post(protect, createOrder)
    .get(protect, getUserOrders);

// Driver Routes
router.get("/available", protectDriver, getAvailableOrders);
router.post("/:id/accept", protectDriver, acceptOrder);
router.put("/:id/status", protectDriver, updateOrderStatus);

module.exports = router;
