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
    getRestaurantMenu,
    getDriverStats,
    getRestaurantStats
} = require("../controllers/adminManagementController");
const {
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner
} = require("../controllers/bannerController");

// Auth & Dashboard
router.post("/auth/login", loginAdmin);
router.get("/dashboard/stats", getDashboardStats);

// Management
router.get("/users", getAllUsers);
router.get("/drivers", getAllDrivers);
router.get("/restaurants", getAllRestaurants);
router.get("/restaurants/:id/menu", getRestaurantMenu);
router.get("/restaurants/:id/stats", getRestaurantStats);
router.get("/orders", getAllOrders);

router.patch("/users/:id/status", toggleUserStatus);
router.patch("/restaurants/:id/status", updateRestaurantStatus);
router.patch("/drivers/:id/status", updateAdminDriverStatus);
router.get("/drivers/:id/stats", getDriverStats);

// Banner Management
router.get("/banners", getAllBanners);
router.post("/banners", createBanner);
router.put("/banners/:id", updateBanner);
router.delete("/banners/:id", deleteBanner);

module.exports = router;
