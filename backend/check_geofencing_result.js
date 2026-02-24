const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require('fs');
const Order = require("./models/Order");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/food_delivery_db";

const checkResult = async () => {
    try {
        // Load Config
        let config;
        try {
            const raw = fs.readFileSync('test_config.json');
            config = JSON.parse(raw);
        } catch (e) {
            console.error("No test_config.json found.");
            process.exit(1);
        }

        await mongoose.connect(MONGO_URI);

        const order = await Order.findById(config.ORDER_ID);
        if (!order) {
            console.error("Order not found!");
        } else {
            console.log("\n--- VERIFICATION RESULTS ---");
            console.log("Order ID:", order._id);
            console.log("Proximity Alerts Status:");
            console.log("500m Alert Sent:", order.proximityAlerts["500m"]);
            console.log("100m Alert Sent:", order.proximityAlerts["100m"]);

            if (order.proximityAlerts["500m"] && order.proximityAlerts["100m"]) {
                console.log("\n✅ SUCCESS: Both alerts were triggered!");
            } else {
                console.log("\n❌ FAILURE: Alerts missing.");
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Check Failed:", error);
    }
};

checkResult();
