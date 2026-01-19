const Restaurant = require("../models/Restaurant");
const Product = require("../models/Product");

// Helper: Calculate distance in km (Haversine Formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// @desc    Get Restaurants by Location (and groceries/products)
// @route   GET /api/restaurants/nearby
// @access  Public
const getNearbyData = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and Longitude are required" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // 1. Fetch All Restaurants (Optimize this with Geospatial Query in real prod)
    const allRestaurants = await Restaurant.find({});

    // 2. Filter by Distance (10km) & Format
    const restaurantsWithDistance = allRestaurants.map((r) => {
      // Handle potetial structure differences
      const rLat = r.address?.coordinates?.lat;
      const rLon = r.address?.coordinates?.lon;

      const distance = calculateDistance(userLat, userLng, rLat, rLon);

      // Format for Frontend
      const cuisineStr = Array.isArray(r.cuisines)
        ? r.cuisines.join(", ")
        : r.cuisines || "";
      const locationStr = r.address
        ? `${r.address.street || ""}, ${r.address.city || ""}`
        : "";

      return {
        ...r.toObject(),
        id: r._id, // Frontend uses 'id'
        cuisine: cuisineStr,
        location: locationStr,
        distance,
      };
    });

    const nearbyRestaurants = restaurantsWithDistance.filter(
      (r) => r.distance <= 10
    );

    // 3. Fetch Products for these restaurants
    // We want to return structure similar to mockData:
    // { restaurants: [...], restaurantItems: { [restId]: [products...] }, ... }

    // Get IDs of nearby restaurants
    const nearbyRestaurantIds = nearbyRestaurants.map((r) => r._id);

    // Fetch products
    const products = await Product.find({
      restaurant: { $in: nearbyRestaurantIds },
    });

    // Group Products by Restaurant ID
    const restaurantItems = {};
    nearbyRestaurantIds.forEach((id) => {
      restaurantItems[id] = products.filter(
        (p) => p.restaurant.toString() === id.toString()
      );
    });

    // 4. Identify Grocery Stores vs Restaurants (using logic or category)
    // Assuming for now all in 'Restaurant' model, but we might distinguish by specific tag or type if available.
    // The user mentioned "groceryu ka ana chiaye".
    // If we don't have a type field, we treat them all as vendors.
    // Ideally, we'd filter: const groceryStores = nearbyRestaurants.filter(r => r.type === 'grocery');
    // For now, return all nearby vendors.

    res.json({
      restaurants: nearbyRestaurants.sort((a, b) => a.distance - b.distance),
      restaurantItems,
      // If you want separate 'grocery' key, add logic here
    });
  } catch (error) {
    console.error("Error fetching nearby data:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getNearbyData,
};
