const mongoose = require("mongoose");
// Require models in dependency order (leaf nodes first)
const Restaurant = require("./models/Restaurant");
const Driver = require("./models/Driver");
const Order = require("./models/Order");
require("dotenv").config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Check Latest Order
        const order = await Order.findOne().sort({ createdAt: -1 }).populate("restaurant");

        if (order) {
            console.log(`ORDER_ID: ${order._id}`);
            if (order.restaurant) {
                const coords = order.restaurant.address?.coordinates;
                console.log("REST_COORDS:", JSON.stringify(coords));
                if (!coords || (!coords.lat && !coords.lon)) {
                    console.log("⚠️  Restaurant coordinates are missing or empty!");
                }
            } else {
                console.log("REST_COORDS: NULL_RESTAURANT");
            }
        } else {
            console.log("ORDER: NONE");
        }

        // Check All Active Drivers
        const drivers = await Driver.find({});
        drivers.forEach(d => {
            const loc = d.location;
            console.log(`DRIVER_${d.name}:`, JSON.stringify(loc));
            if (loc && loc.type === 'Point' && loc.coordinates) {
                const [lon, lat] = loc.coordinates;
                console.log(`   -> Lat: ${lat}, Lon: ${lon}`);
            }
        });

    } catch (e) { console.error(e); }
    finally { mongoose.connection.close(); }
};
debug();
