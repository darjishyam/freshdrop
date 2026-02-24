const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

const inspectRestaurant = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected.');

        // Find by email or name regex
        const restaurant = await Restaurant.findOne({
            $or: [
                { email: { $regex: /sampat/i } },
                { name: { $regex: /sampat/i } }
            ]
        });

        if (!restaurant) {
            console.log("Restaurant not found!");
            process.exit(1);
        }

        console.log("PRE-SAVE STATE:", JSON.stringify(restaurant.toObject(), null, 2));

        // Fix Address if missing or empty
        if (!restaurant.address || !restaurant.address.street || !restaurant.address.city) {
            console.log("Fixing Address...");

            // Safe coordinates retrieval or default
            let coords = { lat: 23.6, lon: 72.3 }; // Default Mahesana
            if (restaurant.address && restaurant.address.coordinates && restaurant.address.coordinates.lat) {
                coords = restaurant.address.coordinates;
            }

            restaurant.address = {
                street: "Main Market, Modhera Road",
                city: "Mahesana",
                zip: "384002",
                coordinates: coords
            };

            // Ensure other potentially missing fields are set
            if (!restaurant.deliveryTime) restaurant.deliveryTime = "30-40 min";
            if (!restaurant.priceRange) restaurant.priceRange = "₹200 for two";

            // Use findOneAndUpdate to bypass potential strict validation issues on other fields
            try {
                const updated = await Restaurant.findOneAndUpdate(
                    { _id: restaurant._id },
                    {
                        $set: {
                            "address.street": "Main Market, Modhera Road",
                            "address.city": "Mahesana",
                            "address.zip": "384002",
                            "status": "APPROVED", // Ensure it's approved
                            "isOpen": true // Ensure it's open
                        }
                    },
                    { new: true }
                );
                console.log("Address & Status Updated via findOneAndUpdate!");
                console.log("New Address:", updated.address);
            } catch (e) {
                console.error("Update Error:", e.message);
            }
        } else {
            console.log("Address checks out fine:", restaurant.address);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error Details:", JSON.stringify(error.errors, null, 2));
        console.error("Full Error:", error);
    }
};

(async () => {
    await inspectRestaurant();
})();
