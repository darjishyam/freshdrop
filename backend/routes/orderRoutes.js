const express = require("express");
const router = express.Router();
const {
    createOrder,
    getUserOrders,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").post(protect, createOrder).get(protect, getUserOrders);

module.exports = router;
