const axios = require('axios');
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api/restaurants/nearby';

const simulate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const r = await Restaurant.findOne({ email: { $regex: /sampat/i } });
        if (!r) {
            console.error("Restaurant not found in DB");
            process.exit(1);
        }

        const lat = r.address.coordinates.lat;
        const lng = r.address.coordinates.lon;

        console.log(`Querying API with Restaurant Coords: Lat=${lat}, Lng=${lng}`);

        try {
            const response = await axios.get(`${API_URL}?lat=${lat}&lng=${lng}`);
            console.log(`API Response Status: ${response.status}`);
            console.log(`Restaurants Found: ${response.data.restaurants.length}`);

            const found = response.data.restaurants.find(rest => rest._id === r._id.toString());

            if (found) {
                console.log("PASS: Sampati Restaurant IS in the API response.");
                console.log("Details:", JSON.stringify(found, null, 2));
            } else {
                console.error("FAIL: Sampati Restaurant is NOT in the API response.");
                console.log("Names found:", response.data.restaurants.map(rest => rest.name));
            }

        } catch (apiError) {
            console.error("API Error:", apiError.message);
            if (apiError.response) {
                console.error("Response:", apiError.response.data);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

simulate();
