const express = require("express");
const router = express.Router();
const {
    loginDriverOtp,
    initiateSignupOtp,
    verifyDriverOtp,
    getDriverProfile,
    updateDriverDetails,
    updateDriverLocation,
    uploadDriverDocuments,
    updateDriverStatus,
    getCityZones,
    completeOrder,
    updateDriverPushToken,
    getDriverNotifications,
    markNotificationRead
} = require("../controllers/driverController");
const { getAvailableOrders, getDriverActiveOrder, getDriverHistory } = require("../controllers/orderController"); // Import from Order Controller
const { protect } = require("../middleware/driverAuthMiddleware");

router.post("/login-otp", loginDriverOtp);
router.post("/signup-otp", initiateSignupOtp);
router.post("/verify-otp", verifyDriverOtp);
router.get("/zones", getCityZones);

// Protected Routes
router.get("/profile", protect, getDriverProfile);
router.put("/status", protect, updateDriverStatus);
router.put("/update-details", protect, updateDriverDetails);
router.put("/location", protect, updateDriverLocation); // New GeoJSON Update
router.put("/upload-documents", protect, uploadDriverDocuments);
router.post("/complete-order", protect, completeOrder);
router.get("/available", protect, getAvailableOrders); // New Route for fetching orders
router.get("/active-order", protect, getDriverActiveOrder); // New Route for active order
router.get("/history", protect, getDriverHistory); // New Route for history
router.put("/push-token", protect, updateDriverPushToken);
router.get("/notifications", protect, getDriverNotifications);
router.put("/notifications/:id/read", protect, markNotificationRead);

module.exports = router;
