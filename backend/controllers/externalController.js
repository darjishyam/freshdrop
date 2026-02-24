const axios = require("axios");

const Restaurant = require("../models/Restaurant"); // Import Restaurant Model

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

// @desc    Get restaurants from Overpass API + Local DB
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

    // 1. Fetch Local Restaurants from MongoDB
    let localRestaurants = [];
    try {
      // Simple find all for now (optimize with geospatial later if needed)
      // Or filter by distance here if we want to be strict
      const allLocal = await Restaurant.find({});

      localRestaurants = allLocal.map(r => {
        const rLat = r.address?.coordinates?.lat || 0;
        const rLon = r.address?.coordinates?.lon || 0;

        // Simple Distance Check (optional, but good to filter relevant ones)
        const dist = Math.sqrt(Math.pow(rLat - parseFloat(lat), 2) + Math.pow(rLon - parseFloat(lon), 2)) * 111; // Approx km

        // Only include if within ~20km (generous radius for test)
        if (dist > 50) return null;

        return {
          id: r._id.toString(),
          name: r.name,
          cuisine: r.cuisines.join(", "),
          lat: rLat,
          lon: rLon,
          address: `${r.address.street}, ${r.address.city}`,
          distance: `${dist.toFixed(1)} km`,
          rating: r.rating || 4.5,
          time: r.deliveryTime || "30-40 min",
          price: r.priceRange || "₹200 for two",
          discount: r.discount || "",
          promoted: r.isPromoted,
          image: r.image,
          tags: [...r.cuisines, "Fast Delivery"],
          coordinates: { lat: rLat, lng: rLon },
          location: r.address.city,
          isLocal: true // Flag to identify our DB restaurants
        };
      }).filter(Boolean);

      console.log(`🏠 Found ${localRestaurants.length} local restaurants`);

    } catch (err) {
      console.error("Local DB Fetch Error:", err);
    }

    // 2. Fetch Overpass Data
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
    let externalRestaurants = [];

    try {
      const response = await axios.get(overpassUrl, {
        params: { data: query },
        timeout: 25000,
        headers: { "User-Agent": "FreshDrop/1.0 (professorshyam123@gmail.com)" },
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

      externalRestaurants = elements.map((el, index) => {
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
          distance: "Nearby",
          rating: (Math.random() * (4.9 - 3.5) + 3.5).toFixed(1),
          time: `${Math.floor(Math.random() * 20) + 25} min`,
          price: "₹200 for two",
          discount: Math.random() > 0.7 ? "50% OFF" : "",
          promoted: Math.random() > 0.9,
          image: restaurantImages[index % restaurantImages.length],
          tags: [cuisine, "Fast Delivery"],
          coordinates: { lat, lng: lon },
          location: el.tags?.["addr:city"] || "City",
        };
      });
    } catch (error) {
      console.warn("Overpass Fetch Failed:", error.message);
      // Don't fail entire request if external API fails, just return local
    }

    // Combine: Local First
    const combinedRestaurants = [...localRestaurants, ...externalRestaurants];
    res.json(combinedRestaurants);
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

    // 1. Fetch Local Grocery Stores from MongoDB
    let localGroceries = [];
    try {
      const allLocal = await Restaurant.find({
        storeType: 'GROCERY',
        status: 'APPROVED'
      });

      localGroceries = allLocal.map(r => {
        const rLat = r.address?.coordinates?.lat || 0;
        const rLon = r.address?.coordinates?.lon || 0;

        // Use Haversine for accurate distance
        const dist = calculateDistance(parseFloat(lat), parseFloat(lon), rLat, rLon);

        // Filter: Only include if within 10km (matching restaurant logic)
        if (dist > 10) return null;

        console.log(`📍 Local Grocery Store ${r.name} is ${dist.toFixed(2)}km away`);

        return {
          id: r._id.toString(),
          name: r.name,
          type: "Grocery Store",
          lat: rLat,
          lon: rLon,
          address: `${r.address.street}, ${r.address.city}`,
          distance: `${dist.toFixed(1)} km`,
          rating: r.rating || 4.5,
          time: r.deliveryTime || "15-20 min",
          image: r.image,
          isLocal: true // Mark as our DB store
        };
      }).filter(Boolean);

      console.log(`🏠 Found ${localGroceries.length} local grocery stores`);
    } catch (err) {
      console.error("Local Grocery Fetch Error:", err);
    }

    // 2. Mock Prominent Brands (as requested by user)
    const mockGroceries = [
      {
        id: "mock_bb_1",
        name: "Big Basket",
        type: "Supermarket",
        lat: parseFloat(lat), // Place near user
        lon: parseFloat(lon),
        address: "Near You",
        distance: "0.5 km",
        rating: "4.8",
        time: "15-25 min",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80",
        isMock: true
      },
      {
        id: "mock_dmart_1",
        name: "D Mart Ready",
        type: "Department Store",
        lat: parseFloat(lat) + 0.005,
        lon: parseFloat(lon) + 0.005,
        address: "City Center",
        distance: "1.2 km",
        rating: "4.6",
        time: "20-30 min",
        image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&q=80",
        isMock: true
      }
    ];

    // 3. Combine Local + Mock
    const combinedGroceries = [...localGroceries, ...mockGroceries];
    res.json(combinedGroceries);
  } catch (error) {
    console.error("Grocery API Error:", error.message);
    res.json([]);
  }
};

module.exports = {
  getRestaurants,
  getGroceries,
};
