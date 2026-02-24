const axios = require('axios');

// Using localhost for verification from the same machine
const API_URL = 'http://localhost:5000/api/orders';

const mongoose = require('mongoose');
const Order = require('./models/Order');
const dotenv = require('dotenv');

dotenv.config();

const simulate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // get latest order
        const order = await Order.findOne({}).sort({ createdAt: -1 });
        if (!order) { console.log("No order"); process.exit(0); }

        console.log(`Attempting to set Order ${order._id} to Preparing`);
        console.log(`Current Status: ${order.status}`);

        // Disconnect mongoose so it doesn't hang
        await mongoose.disconnect();

        console.log(`Sending PUT to ${API_URL}/${order._id}/restaurant-status`);

        const res = await axios.put(`${API_URL}/${order._id}/restaurant-status`, {
            status: 'Preparing'
        });

        console.log("Response Status:", res.status);
        console.log("Response Data Status:", res.data.status);

    } catch (e) {
        console.error("AXIOS ERROR:", e.message);
        if (e.response) {
            console.error("Response Data:", e.response.data);
            console.error("Response Status:", e.response.status);
        }
    }
}

simulate();
