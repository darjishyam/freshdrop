const {
  fetchRestaurants,
  fetchGroceries,
} = require("../services/locationService");

// @desc    Get nearby restaurants
// @route   GET /api/location/restaurants
const getNearbyRestaurants = async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ message: "Latitude and Longitude are required" });
    }

    const restaurants = await fetchRestaurants(lat, lon, radius);
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get grocery items (mocked location context for now)
// @route   GET /api/location/groceries
const getGroceries = async (req, res) => {
  try {
    const { query } = req.query; // e.g., 'milk', 'chocolate'
    const products = await fetchGroceries(query || "popular");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNearbyRestaurants,
  getGroceries,
};
