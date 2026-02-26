const express = require("express");
const router = express.Router();
const { loginAdmin, getDashboardStats } = require("../controllers/adminAuthController");
const {
    getAllUsers,
    getAllDrivers,
    getAllRestaurants,
    getAllOrders,
    toggleUserStatus,
    updateRestaurantStatus,
    updateAdminDriverStatus,
    getRestaurantMenu
} = require("../controllers/adminManagementController");

// Auth & Dashboard
router.post("/auth/login", loginAdmin);
router.get("/dashboard/stats", getDashboardStats);

// Management
router.get("/users", getAllUsers);
router.get("/drivers", getAllDrivers);
router.get("/restaurants", getAllRestaurants);
router.get("/restaurants/:id/menu", getRestaurantMenu);
router.get("/orders", getAllOrders);

router.patch("/users/:id/status", toggleUserStatus);
router.patch("/restaurants/:id/status", updateRestaurantStatus);
router.patch("/drivers/:id/status", updateAdminDriverStatus);

module.exports = router;
