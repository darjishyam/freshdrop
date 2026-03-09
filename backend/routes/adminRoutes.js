const express = require("express");
const router = express.Router();
const { loginAdmin, getDashboardStats } = require("../controllers/adminAuthController");
const {
    getAllUsers,
    getAllDrivers,
    getAllRestaurants,
    getAllOrders,
    updateOrderStatus,
    toggleUserStatus,
    updateRestaurantStatus,
    updateAdminDriverStatus,
    getRestaurantMenu,
    getDriverStats,
    getRestaurantStats,
    getRestaurantOrderHistory
} = require("../controllers/adminManagementController");
const {
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner
} = require("../controllers/bannerController");
const {
    getAllBannerRequests,
    updateBannerRequestStatus
} = require("../controllers/bannerRequestController");
const {
    getAllTiers,
    updateTier
} = require("../controllers/tierController");

// Auth & Dashboard
router.post("/auth/login", loginAdmin);
router.get("/dashboard/stats", getDashboardStats);

// Management
router.get("/users", getAllUsers);
router.get("/drivers", getAllDrivers);
router.get("/restaurants", getAllRestaurants);
router.get("/restaurants/:id/menu", getRestaurantMenu);
router.get("/restaurants/:id/stats", getRestaurantStats);
router.get("/restaurants/:id/history", getRestaurantOrderHistory);
router.get("/orders", getAllOrders);

router.patch("/users/:id/status", toggleUserStatus);
router.patch("/restaurants/:id/status", updateRestaurantStatus);
router.patch("/drivers/:id/status", updateAdminDriverStatus);
router.patch("/orders/:id/status", updateOrderStatus);
router.get("/drivers/:id/stats", getDriverStats);

// Banner Management
router.get("/banners", getAllBanners);
router.post("/banners", createBanner);
router.put("/banners/:id", updateBanner);
router.delete("/banners/:id", deleteBanner);

// Banner Request Management
router.get("/banners/requests", getAllBannerRequests);
router.put("/banners/requests/:id", updateBannerRequestStatus);

// Banner Tier Management
router.get("/banners/tiers", getAllTiers);
router.put("/banners/tiers/:id", updateTier);

// Revenue Stats
const { getRevenueStats } = require("../controllers/revenueController");
router.get("/banners/revenue/stats", getRevenueStats);

module.exports = router;
