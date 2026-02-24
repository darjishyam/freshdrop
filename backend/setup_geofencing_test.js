const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require('fs');
const User = require("./models/User");
const Driver = require("./models/Driver");
const Order = require("./models/Order");
const Restaurant = require("./models/Restaurant");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/food_delivery_db";

const setupTest = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        // 1. Find REAL User and update their Push Token
        // Using the actual user who is logged in on the phone
        let user = await User.findById("6979d4b5743e2330812a7db1"); // professorshyam123@gmail.com
        if (!user) {
            console.error("Real user not found! Make sure you're logged into the SwiggyClone APK.");
            process.exit(1);
        }
        user.pushToken = "ExponentPushToken[cjh2_PD440U2vEd1mghkS7]"; // Real token from your phone
        await user.save();
        console.log("Updated Real User Push Token:", user.email);

        // 2. Find or Create Driver
        let driver = await Driver.findOne({ email: "driver_test@example.com" });
        if (!driver) {
            driver = await Driver.create({
                name: "Test Driver",
                email: "driver_test@example.com",
                phone: "8888888888",
                city: "Mahesana",
                isOnline: true,
                status: "ACTIVE"
            });
            console.log("Created Test Driver");
        }

        // 3. Find a Restaurant
        const restaurant = await Restaurant.findOne();
        if (!restaurant) {
            console.error("No restaurants found! Please seed restaurants.");
            process.exit(1);
        }

        // 4. Create Active Order
        // First, cleanup old orders for this driver to avoid ambiguity
        await Order.deleteMany({ driver: driver._id, status: "Out for Delivery" });
        console.log("Cleaned up old test orders");

        const order = await Order.create({
            user: user._id,
            driver: driver._id,
            restaurant: restaurant._id,
            items: [{ name: "Test Item", price: 100, quantity: 1 }],
            totalAmount: 100,
            status: "Out for Delivery",
            deliveryAddress: {
                street: "Test St",
                city: "Mahesana",
                lat: 23.5880, // Target Location
                lon: 72.3693
            },
            proximityAlerts: { "500m": false, "100m": false }
        });

        // Write Config
        const config = {
            DRIVER_ID: driver._id,
            ORDER_ID: order._id,
            CUSTOMER_LAT: order.deliveryAddress.lat,
            CUSTOMER_LON: order.deliveryAddress.lon
        };
        fs.writeFileSync('test_config.json', JSON.stringify(config, null, 2));
        console.log("Config written to test_config.json");

        await mongoose.disconnect();
    } catch (error) {
        console.error("Setup Failed:", error);
    }
};

setupTest();
