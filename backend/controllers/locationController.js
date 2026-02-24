const {
  fetchRestaurants,
  fetchGroceries,
} = require("../services/locationService");
const Address = require("../models/Address"); // Import Address Model

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

// @desc    Save/Update User Address
// @route   POST /api/location/address
// @access  Private
const saveAddress = async (req, res) => {
  try {
    const { street, type, coordinates } = req.body;
    const userId = req.user._id; // Assumes protect middleware

    if (!street) {
      return res.status(400).json({ message: "Street address is required" });
    }

    // Default city if not provided (Simplification)
    // In a real app, you'd extract city from the address string or geocoding
    const city = "Mahesana";

    // Find existing address by type for this user to update, OR create new
    // For simplicity in this demo, we'll maintain one address per type (Home/Work)
    let address = await Address.findOne({ user: userId, type: type || 'Home' });

    if (address) {
      address.street = street;
      address.coordinates = coordinates;
      address.city = city;
      address.isDefault = true; // Make this the default
    } else {
      address = new Address({
        user: userId,
        street,
        type: type || 'Home',
        city,
        coordinates,
        isDefault: true
      });
    }

    // Reset other addresses isDefault if this one is default
    if (address.isDefault) {
      await Address.updateMany(
        { user: userId, _id: { $ne: address._id } },
        { isDefault: false }
      );
    }

    const savedAddress = await address.save();
    res.status(201).json(savedAddress);

  } catch (error) {
    console.error("Save Address Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNearbyRestaurants,
  getGroceries,
  saveAddress,
};
