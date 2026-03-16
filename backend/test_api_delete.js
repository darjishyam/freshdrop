const axios = require('axios');
const mongoose = require('mongoose');
const Grocery = require('./models/Grocery');
const Product = require('./models/Product');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000/api';

async function testFrontendDelete() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find a grocery owner
        const store = await Grocery.findOne({ email: 'kariyana@tests.com' }) || await Grocery.findOne({});
        if (!store) return console.log("No store found");

        console.log(`Using Store: ${store.name} (${store._id})`);

        // Generate token exactly like the backend does
        const token = jwt.sign({ id: store._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        // Add a dummy item to delete
        const dummyItem = await Product.create({
            merchantType: 'Grocery',
            restaurant: store._id,
            name: "Dummy Delete Test",
            price: 10,
            category: "Test",
            isVeg: true
        });

        console.log(`Created dummy item: ${dummyItem._id}`);

        // Hit the real API just like the frontend app
        console.log(`Sending DELETE request to: ${API_URL}/menu/${dummyItem._id}`);
        try {
            const res = await axios.delete(`${API_URL}/menu/${dummyItem._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Delete Response:", res.data);
        } catch (err) {
            console.error("Delete Error:", err.response ? err.response.data : err.message);
        }

        // Verify if it's gone
        const check = await Product.findById(dummyItem._id);
        console.log(`Item still exists in DB? ${!!check}`);

        if (check) await Product.findByIdAndDelete(dummyItem._id);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

testFrontendDelete();
