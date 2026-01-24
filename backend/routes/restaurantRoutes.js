const express = require("express");
const router = express.Router();
const { getNearbyData, getRestaurantById, saveExternalRestaurant } = require("../controllers/restaurantController");

router.get("/nearby", getNearbyData);
router.post("/save-external", saveExternalRestaurant);
router.get("/:id", getRestaurantById);

module.exports = router;
