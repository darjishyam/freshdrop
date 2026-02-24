const express = require("express");
const router = express.Router();
const { getNearbyData, getRestaurantById, saveExternalRestaurant, getMockRestaurants } = require("../controllers/restaurantController");
const Restaurant = require("../models/Restaurant");

router.get("/nearby", getNearbyData);
router.get("/mock", getMockRestaurants); // New Mock Route
router.post("/save-external", saveExternalRestaurant);

// Called by Restaurant backend when isOpen changes
router.post("/status-update", async (req, res) => {
    try {
        const { restaurantId, isOpen } = req.body;
        if (!restaurantId || isOpen === undefined) {
            return res.status(400).json({ message: "restaurantId and isOpen required" });
        }
        // Update in DB
        await Restaurant.findByIdAndUpdate(restaurantId, { isOpen });
        // Emit to all connected User App clients via this backend's socket
        const io = req.app.get("io");
        if (io) {
            io.emit("restaurantStatusChanged", { restaurantId, isOpen });
            console.log(`📡 [UserBackend] Emitted restaurantStatusChanged: ${restaurantId} isOpen=${isOpen}`);
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Status update error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

router.get("/:id", getRestaurantById);

module.exports = router;
