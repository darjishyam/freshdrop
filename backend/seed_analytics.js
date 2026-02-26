const mongoose = require("mongoose");
const User = require("./models/User");
const Order = require("./models/Order");
const Restaurant = require("./models/Restaurant");
const Driver = require("./models/Driver");
require("dotenv").config();

const seedAnalytics = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Create Sample Users
        console.log("👤 Seeding users...");
        const users = await User.insertMany([
            { name: "John Doe", email: "john@example.com", phone: "9876543210", isVerified: true },
            { name: "Jane Smith", email: "jane@example.com", phone: "9876543211", isVerified: true },
            { name: "Rahul Kumar", email: "rahul@example.com", phone: "9876543212", isVerified: true }
        ]);

        // 2. Create Sample Online Drivers
        console.log("🚚 Seeding drivers...");
        await Driver.insertMany([
            { name: "Driver One", phone: "9000000001", isOnline: true, status: "ACTIVE" },
            { name: "Driver Two", phone: "9000000002", isOnline: true, status: "ACTIVE" }
        ]);

        // 3. Get a Restaurant
        const restaurant = await Restaurant.findOne();
        if (!restaurant) {
            console.log("⚠️ No restaurant found. Please run seedDatabase.js first.");
            process.exit(1);
        }

        // 4. Create Sample Orders
        console.log("📦 Seeding orders...");
        await Order.insertMany([
            {
                user: users[0]._id,
                restaurant: restaurant._id,
                totalAmount: 450,
                status: "Delivered",
                deliveryAddress: { street: "Main St", city: "Mumbai" }
            },
            {
                user: users[1]._id,
                restaurant: restaurant._id,
                totalAmount: 1200,
                status: "Delivered",
                deliveryAddress: { street: "Park Ave", city: "Mumbai" }
            },
            {
                user: users[2]._id,
                restaurant: restaurant._id,
                totalAmount: 350,
                status: "Order Placed",
                deliveryAddress: { street: "MG Road", city: "Mumbai" }
            }
        ]);

        console.log("✅ Analytics seeding completed!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding error:", error);
        process.exit(1);
    }
};

seedAnalytics();
