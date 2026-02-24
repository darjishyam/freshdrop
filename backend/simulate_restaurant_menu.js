const axios = require('axios');
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api/restaurants';

const simulate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find Sampati
        const r = await Restaurant.findOne({ email: { $regex: /sampat/i } });
        if (!r) {
            console.error("Restaurant not found");
            process.exit(1);
        }

        console.log(`Fetching Menu for: ${r.name} (${r._id})`);

        try {
            const response = await axios.get(`${API_URL}/${r._id}`);
            console.log(`API Response Status: ${response.status}`);

            const products = response.data.products;
            console.log(`Total Products Returned: ${products.length}`);

            const samosa = products.find(p => p.name.toLowerCase().includes('samosa'));

            if (samosa) {
                console.log("PASS: Samosa IS in the API response.");
                console.log(JSON.stringify(samosa, null, 2));
            } else {
                console.error("FAIL: Samosa is NOT in the API response.");
                console.log("Products found:", products.map(p => p.name));
            }

        } catch (apiError) {
            console.error("API Error:", apiError.message);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

simulate();
