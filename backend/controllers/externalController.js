const axios = require("axios");

// @desc    Get restaurants from Overpass API
// @route   GET /api/external/restaurants
// @access  Public (or Protected if needed)
const getRestaurants = async (req, res) => {
  try {
    const { lat, lon, radius = 2000 } = req.query; // Default 2km radius

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ message: "Latitude and Longitude are required" });
    }

    // Overpass QL query
    const query = `
      [out:json];
      (
        node["amenity"~"restaurant|cafe|fast_food"](around:${radius},${lat},${lon});
        way["amenity"~"restaurant|cafe|fast_food"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const response = await axios.get(overpassUrl, {
      params: { data: query },
      timeout: 25000, // Increased to 25s for slower connections
      headers: {
        "User-Agent": "FreshDrop/1.0 (professorshyam123@gmail.com)", // Required by Overpass
      },
    });

    const elements = response.data.elements || [];

    // Mock Images List
    const restaurantImages = [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&q=80",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500&q=80",
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80",
    ];

    const restaurants = elements.map((el, index) => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      const cuisine = el.tags?.cuisine || el.tags?.amenity || "Multi-Cuisine";

      return {
        id: el.id.toString(),
        name: el.tags?.name || "Local Restaurant",
        cuisine: cuisine.split(";").join(", "),
        lat: lat,
        lon: lon,
        address: el.tags?.["addr:street"] || "Nearby",
        distance: "Nearby", // Can calculate exact distance if needed
        rating: (Math.random() * (4.9 - 3.5) + 3.5).toFixed(1),
        time: `${Math.floor(Math.random() * 20) + 25} min`,
        price: "₹200 for two",
        discount: Math.random() > 0.7 ? "50% OFF" : "",
        promoted: Math.random() > 0.9,
        image: restaurantImages[index % restaurantImages.length],
        tags: [cuisine, "Fast Delivery"],
        coordinates: { lat, lng: lon }, // Match frontend structure
        location: el.tags?.["addr:city"] || "City",
      };
    });

    res.json(restaurants);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.warn("Overpass API Rate Limit (429) hit - serving empty list.");
    } else {
      console.error("Overpass API Error:", error.message);
    }
    // Return empty array on error to prevent crash
    res.json([]);
  }
};

// @desc    Get grocery stores from Overpass API
// @route   GET /api/external/groceries
// @access  Public (or Protected)
const getGroceries = async (req, res) => {
  try {
    const { lat, lon, radius = 3000 } = req.query;

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ message: "Latitude and Longitude are required for Groceries" });
    }

    console.log(`🛒 Groceries Query - Lat: ${lat}, Lon: ${lon}, Radius: ${radius}`);

    const query = `
      [out:json];
      (
        node["shop"~"supermarket|convenience|general|department_store"](around:${radius},${lat},${lon});
        way["shop"~"supermarket|convenience|general|department_store"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const response = await axios.get(overpassUrl, {
      params: { data: query },
      timeout: 25000,
      headers: {
        "User-Agent": "FreshDrop/1.0 (professorshyam123@gmail.com)",
      },
    });

    const elements = response.data.elements || [];
    console.log(`🛒 Groceries Found: ${elements.length}`);

    const groceryImages = [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80",
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&q=80",
      "https://images.unsplash.com/photo-1604719312566-b76d4685332e?w=500&q=80",
    ];

    const groceries = elements.map((el, index) => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;

      return {
        id: el.id.toString(),
        name: el.tags?.name || "Grocery Store",
        type: el.tags?.shop || "Supermarket",
        lat: lat,
        lon: lon,
        address: el.tags?.["addr:street"] || "Nearby",
        distance: "Nearby",
        rating: (Math.random() * (4.8 - 3.5) + 3.5).toFixed(1),
        time: `${Math.floor(Math.random() * 15) + 15} min`,
        image: groceryImages[index % groceryImages.length],
      };
    });

    res.json(groceries);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.warn("Overpass API (Groceries) Rate Limit (429) hit - serving empty list.");
    } else {
      console.error("Overpass API (Groceries) Error:", error.message);
    }
    res.json([]);
  }
};

module.exports = {
  getRestaurants,
  getGroceries,
};
