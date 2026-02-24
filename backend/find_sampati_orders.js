const mongoose = require('mongoose');
const Order = require('./models/Order');
const Restaurant = require('./models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

const findSampatiOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find Sampati Restaurant
        const sampati = await Restaurant.findOne({ name: { $regex: /sampat/i } });

        if (!sampati) {
            console.log("Sampati Restaurant NOT FOUND in DB!");
            process.exit(0);
        }

        console.log(`Found Sampati: ${sampati.name} (${sampati._id})`);

        // Find Orders for this restaurant
        const orders = await Order.find({ restaurant: sampati._id }).sort({ createdAt: -1 });

        console.log(`Found ${orders.length} orders for Sampati.`);

        orders.forEach(o => {
            console.log("----------------");
            console.log("ID: " + o._id);
            console.log("Status: " + o.status);
            console.log("Time: " + o.createdAt);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

findSampatiOrders();
