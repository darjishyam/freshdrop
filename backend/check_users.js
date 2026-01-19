const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const User = require("./models/User");

// Test function to check user phone numbers
async function checkGoogleUsers() {
  try {
    const googleUsers = await User.find({ googleId: { $exists: true } });

    console.log("\n📊 Google Users in Database:");
    console.log("=".repeat(50));

    googleUsers.forEach((user) => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Phone: ${user.phone || "NOT SET"}`);
      console.log(`Google ID: ${user.googleId}`);
      console.log("-".repeat(50));
    });

    console.log(`\nTotal Google users: ${googleUsers.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkGoogleUsers();
