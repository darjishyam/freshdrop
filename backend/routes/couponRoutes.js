const express = require("express");
const router = express.Router();
const {
    createCoupon,
    getAllCoupons,
    updateCoupon,
    deleteCoupon,
    validateCoupon
} = require("../controllers/couponController");
const { protect } = require("../middleware/authMiddleware");

// Admin routes (would ideally have an admin middleware, but following existing patterns)
router.post("/", createCoupon);
router.get("/", getAllCoupons);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

// Customer facing routes
router.post("/validate", protect, validateCoupon);

module.exports = router;
