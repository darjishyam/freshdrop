const mongoose = require("mongoose");
const Order = require("./models/Order");
require("dotenv").config();

const ORDER_ID = "6995b641127a21edbfd9972e"; // From previous logs

const fixOrder = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const order = await Order.findById(ORDER_ID);
        if (!order) {
            console.log("Order not found!");
            process.exit(1);
        }

        console.log(`Current Status: ${order.status}`);

        // Force set to Ready
        order.status = "Ready";

        // Remove the "Confirmed" timeline entry if it exists at the end
        // (Optional, but cleaner)

        await order.save();
        console.log(`Updated Order ${ORDER_ID} to status: ${order.status}`);
        console.log("Please refresh the Driver App.");

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

fixOrder();
