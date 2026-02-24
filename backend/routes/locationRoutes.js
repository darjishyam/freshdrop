const express = require("express");
const router = express.Router();
const {
  getNearbyRestaurants,
  getGroceries,
  saveAddress,
} = require("../controllers/locationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/restaurants", getNearbyRestaurants);
router.get("/groceries", getGroceries);
router.post("/address", protect, saveAddress);

module.exports = router;
