const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const seedAdmin = async () => {
    try {
        
        await mongoose.connect(process.env.MONGO_URI);
        

        const db = mongoose.connection.db;
        const collection = db.collection("admins");

        
        await collection.deleteOne({ email: "admin@swiggy.com" });
        

        
        const hashedPassword = await bcrypt.hash("adminpassword123", 10);

        await collection.insertOne({
            name: "Super Admin",
            email: "admin@swiggy.com",
            password: hashedPassword,
            role: "SUPER_ADMIN",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        

        process.exit(0);
    } catch (error) {
        console.error("❌ CRITICAL FAILURE (RAW):", error);
        process.exit(1);
    }
};

seedAdmin();
