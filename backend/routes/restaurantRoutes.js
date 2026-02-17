const express = require("express");
const router = express.Router();
const { getNearbyData, getRestaurantById, saveExternalRestaurant, getMockRestaurants } = require("../controllers/restaurantController");

router.get("/nearby", getNearbyData);
router.get("/mock", getMockRestaurants); // New Mock Route
router.post("/save-external", saveExternalRestaurant);
router.get("/:id", getRestaurantById);

module.exports = router;
