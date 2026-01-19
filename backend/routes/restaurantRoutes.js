const express = require("express");
const router = express.Router();
const { getNearbyData } = require("../controllers/restaurantController");

router.get("/nearby", getNearbyData);

module.exports = router;
