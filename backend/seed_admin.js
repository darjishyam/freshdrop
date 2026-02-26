const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const seedAdmin = async () => {
    try {
        console.log("STEP 1: Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ STEP 1 SUCCESS: Connected");

        const db = mongoose.connection.db;
        const collection = db.collection("admins");

        console.log("STEP 2: Deleting existing admin (RAW)...");
        await collection.deleteOne({ email: "admin@swiggy.com" });
        console.log("✅ STEP 2 SUCCESS");

        console.log("STEP 3: Creating admin (RAW)...");
        const hashedPassword = await bcrypt.hash("adminpassword123", 10);

        await collection.insertOne({
            name: "Super Admin",
            email: "admin@swiggy.com",
            password: hashedPassword,
            role: "SUPER_ADMIN",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log("✅ STEP 3 SUCCESS: Admin user created RAW");

        process.exit(0);
    } catch (error) {
        console.error("❌ CRITICAL FAILURE (RAW):", error);
        process.exit(1);
    }
};

seedAdmin();
