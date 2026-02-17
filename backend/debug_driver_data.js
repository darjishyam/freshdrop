const mongoose = require("mongoose");
const Driver = require("./models/Driver");
const Restaurant = require("./models/Restaurant");
require("dotenv").config();

const debugData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Find the Driver (Assuming there's only one we are testing, or list all)
        const drivers = await Driver.find({});
        console.log(`\nFound ${drivers.length} drivers:`);
        drivers.forEach(d => {
            console.log(`Driver: ${d.name} (${d._id})`);
            console.log(`  City: ${d.city}`);
            console.log(`  Location: ${JSON.stringify(d.location)}`);
            console.log(`  PushToken: ${d.pushToken}`);
            console.log("------------------------------------------------");
        });

        // 2. Find the Restaurant
        const restaurants = await Restaurant.find({ name: /Swiggy Test/i });
        console.log(`\nFound ${restaurants.length} restaurants:`);
        restaurants.forEach(r => {
            console.log(`Restaurant: ${r.name} (${r._id})`);
            console.log(`  City: ${r.address?.city}`);
            console.log(`  Location: ${JSON.stringify(r.address?.coordinates)}`);
            console.log("------------------------------------------------");
        });

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

debugData();
