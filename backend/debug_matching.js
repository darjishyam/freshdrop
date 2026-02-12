const mongoose = require("mongoose");
// Require models in dependency order (leaf nodes first)
const Restaurant = require("./models/Restaurant");
const Driver = require("./models/Driver");
const Order = require("./models/Order");
require("dotenv").config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const order = await Order.findOne().sort({ createdAt: -1 }).populate("restaurant");

        if (order) {
            console.log(`ORDER: ${order._id}`);
            console.log(`STATUS: ${order.status}`);

            if (order.restaurant && order.restaurant.address) {
                // Check if populated
                console.log(`REST_NAME: ${order.restaurant.name}`);
                console.log(`REST_ADDR:`, JSON.stringify(order.restaurant.address));
            } else {
                console.log(`REST_RAW:`, order.restaurant);
            }
        }

        const drivers = await Driver.find({});
        drivers.forEach(d => {
            console.log(`DRIVER: ${d.name} | ONLINE: ${d.isOnline} | STATUS: ${d.status}`);
            console.log(`LOC:`, JSON.stringify(d.location));
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
};

debug();
