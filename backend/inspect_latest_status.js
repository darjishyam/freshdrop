const mongoose = require('mongoose');
const Order = require('./models/Order');
const dotenv = require('dotenv');

dotenv.config();

const inspectOrder = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const orders = await Order.find({}).sort({ createdAt: -1 }).limit(1);

        if (orders.length === 0) {
            console.log("No orders found");
        } else {
            const o = orders[0];
            console.log("Order ID:", o._id);
            console.log("Current Status:", o.status);
            console.log("Timeline:", JSON.stringify(o.timeline, null, 2));
            console.log("User:", o.user);
            console.log("Restaurant:", o.restaurant);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

inspectOrder();
