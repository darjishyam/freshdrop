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

// @desc    Get Restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Fetching restaurant with ID:", id);

    // Validate ObjectId format
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid ObjectId format:", id);
      return res.status(400).json({ message: "Invalid restaurant ID format" });
    }

    // Fetch restaurant
    const restaurant = await Restaurant.findById(id);
    console.log("Restaurant found:", restaurant ? restaurant.name : "Not found");

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Fetch products for this restaurant
    const products = await Product.find({ restaurant: id });
    console.log("Products found:", products.length);

    // Format for Frontend
    const cuisineStr = Array.isArray(restaurant.cuisines)
      ? restaurant.cuisines.join(", ")
      : restaurant.cuisines || "";
    const locationStr = restaurant.address
      ? `${restaurant.address.street || ""}, ${restaurant.address.city || ""}`
      : "";

    const formattedRestaurant = {
      ...restaurant.toObject(),
      id: restaurant._id,
      cuisine: cuisineStr,
      location: locationStr,
      time: restaurant.deliveryTime,
      priceForTwo: restaurant.priceRange,
    };

    res.json({
      restaurant: formattedRestaurant,
      products: products.map(p => ({
        ...p.toObject(),
        id: p._id,
        restaurantId: restaurant._id.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Save or Get External Restaurant (from Overpass API)
// @route   POST /api/restaurants/save-external
// @access  Public
const saveExternalRestaurant = async (req, res) => {
  try {
    const { externalId, name, cuisine, address, image, time, price } = req.body;

    console.log("Saving external restaurant:", externalId, name);

    // Check if restaurant already exists
    let restaurant = await Restaurant.findOne({ externalId });

    if (restaurant) {
      console.log("Restaurant already exists:", restaurant._id);
      return res.json({
        _id: restaurant._id,
        name: restaurant.name,
        isNew: false,
      });
    }

    // Create new restaurant with defaults
    const cuisineArray = cuisine ? cuisine.split(",").map(c => c.trim()) : ["Multi-Cuisine"];

    restaurant = await Restaurant.create({
      externalId,
      name: name || "Restaurant",
      cuisines: cuisineArray,
      address: {
        street: address?.street || "Nearby",
        city: address?.city || "City",
        coordinates: {
          lat: address?.coordinates?.lat || 0,
          lon: address?.coordinates?.lon || 0,
        },
      },
      image: image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80",
      rating: 0,
      ratingCount: 0,
      deliveryTime: time || "30-40 min",
      priceRange: price || "₹200 for two",
      discount: "",
      isOpen: true,
    });

    console.log("Created new restaurant:", restaurant._id);

    res.status(201).json({
      _id: restaurant._id,
      name: restaurant.name,
      isNew: true,
    });
  } catch (error) {
    console.error("Error saving external restaurant:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  getNearbyData,
  getRestaurantById,
  saveExternalRestaurant,
};
