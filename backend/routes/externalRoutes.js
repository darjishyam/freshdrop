const express = require("express");
const router = express.Router();
const {
  getRestaurants,
  getGroceries,
} = require("../controllers/externalController");
const { getActiveBanners, recordBannerClick } = require("../controllers/bannerController");
const { getActiveTiers } = require("../controllers/tierController");
const { protect } = require("../middleware/authMiddleware"); // Optional: Use if you want to protect these routes

// You can add 'protect' middleware here if users must be logged in to search
router.get("/restaurants", getRestaurants);
router.get("/groceries", getGroceries);
router.get("/banners", getActiveBanners);
router.post("/banners/click/:id", recordBannerClick);
router.get("/banners/tiers", getActiveTiers);

module.exports = router;
