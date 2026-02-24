const mongoose = require('mongoose');
const Order = require('./models/Order');
const dotenv = require('dotenv');

dotenv.config();

const inspectOrder = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(3);

        if (orders.length === 0) {
            console.log("No orders found!");
        } else {
            const Restaurant = require('./models/Restaurant');
            for (const o of orders) {
                console.log("\n==================================");
                console.log("ID: " + o._id);
                console.log("STATUS: " + o.status);
                console.log("REST ID: " + o.restaurant);

                const r = await Restaurant.findById(o.restaurant);
                console.log("REST EXISTS: " + (r ? "YES (" + r.name + ")" : "NO!!!!!!!"));

                console.log("ITEMS: " + o.items.length);
                console.log("TIME: " + o.createdAt);
            }
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspectOrder();
