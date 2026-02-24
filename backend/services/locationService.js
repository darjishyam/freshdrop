const Restaurant = require("../models/Restaurant");

// Helper to calculate distance between two coordinates in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

const fetchRestaurants = async (lat, lon, radius = 10) => { // Default radius 10KM
  try {
    // 1. Fetch all active restaurants
    // (Optimization: In future, use MongoDB $geoNear if index exists)
    const allRestaurants = await Restaurant.find({
      status: 'APPROVED',
      isAcceptingOrders: true
    });

    if (!lat || !lon) {
      return allRestaurants; // Return all if no location provided (fallback)
    }

    // 2. Filter by distance
    const nearbyRestaurants = allRestaurants.map(restaurant => {
      // Check if restaurant has valid coordinates
      if (restaurant.address && restaurant.address.coordinates &&
        restaurant.address.coordinates.lat && restaurant.address.coordinates.lon) {

        const distance = getDistanceFromLatLonInKm(
          lat,
          lon,
          restaurant.address.coordinates.lat,
          restaurant.address.coordinates.lon
        );

        return { ...restaurant.toObject(), distance }; // Append distance
      }
      return null;
    })
      .filter(item => item !== null && item.distance <= radius) // Filter within radius
      .sort((a, b) => a.distance - b.distance); // Sort by nearest

    return nearbyRestaurants;

  } catch (error) {
    console.error("Error in fetchRestaurants service:", error);
    return [];
  }
};

const fetchGroceries = async (query = "snacks") => {
  return [];
};

module.exports = {
  fetchRestaurants,
  fetchGroceries,
  getDistanceFromLatLonInKm,
};
