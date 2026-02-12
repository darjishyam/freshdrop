const fs = require('fs');
const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const Driver = require("./models/Driver");
const Order = require("./models/Order");
require("dotenv").config();

const log = (msg) => fs.appendFileSync('debug_output.txt', msg + '\n');

const debug = async () => {
    try {
        if (fs.existsSync('debug_output.txt')) fs.unlinkSync('debug_output.txt');

        await mongoose.connect(process.env.MONGO_URI);
        log("DB Connected");

        const orders = await Order.find().sort({ createdAt: -1 }).limit(5);

        if (orders.length === 0) {
            log("❌ No orders found");
        } else {
            log(`Found ${orders.length} recent orders:`);
            for (const order of orders) {
                log("------------------------------------------------");
                log(`ORDER_ID: ${order._id}`);
                log(`CREATED_AT: ${order.createdAt}`);
                log(`STATUS: ${order.status}`);
                log(`DRIVER_ASSIGNED: ${order.driver || 'NULL'}`);
                log(`RAW_RESTAURANT_ID: ${order.restaurant}`); // Log unpopulated ID

                // Manually populate to check validity
                const populated = await Order.populate(order, { path: 'restaurant' });
                if (populated.restaurant) {
                    log(`REST_NAME: ${populated.restaurant.name}`);
                    if (populated.restaurant.address && populated.restaurant.address.coordinates) {
                        log(`REST_COORDS: ${JSON.stringify(populated.restaurant.address.coordinates)}`);
                    } else {
                        log("❌ REST_COORDS_MISSING");
                    }
                } else {
                    log("❌ RESTAURANT_POPULATE_FAILED (Invalid ID?)");
                }
            }
        }

    } catch (e) {
        log(`ERROR: ${e.message}`);
    } finally {
        mongoose.connection.close();
    }
};

debug();
