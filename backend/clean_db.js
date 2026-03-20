const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const Order = require("./models/Order");
require("dotenv").config();

const clean = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        

        // 1. Find 'Unknown' or 'Default' restaurants
        const badRestaurants = await Restaurant.find({
            $or: [
                { name: "Unknown" },
                { name: "Restaurant" }, // Generic name
                { "address.coordinates.lat": 0, "address.coordinates.lon": 0 } // Bad coords
            ]
        });

        

        for (const r of badRestaurants) {
            

            // Delete associated orders
            const orders = await Order.deleteMany({ restaurant: r._id });
            

            await Restaurant.findByIdAndDelete(r._id);
        }

        // 2. Delete Orders with missing restaurant (orphaned)
        // This is harder to do in one query without lookup, but we can check populated
        // actually if schema requires restaurant, it might be there but null? 
        // We'll skip this for now safely.

        

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

clean();
