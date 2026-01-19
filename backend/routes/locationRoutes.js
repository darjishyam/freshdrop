const express = require("express");
const router = express.Router();
const {
  getNearbyRestaurants,
  getGroceries,
} = require("../controllers/locationController");

router.get("/restaurants", getNearbyRestaurants);
router.get("/groceries", getGroceries);

module.exports = router;
