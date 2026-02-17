const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Robust path resolution
const Restaurant = require(path.resolve(__dirname, "../backend/models/Restaurant.js"));
const connectDB = require(path.resolve(__dirname, "../backend/config/db.js"));

dotenv.config({ path: path.resolve(__dirname, "../backend/.env") }); // Load env from backend

const mockRestaurants = [
    {
        name: "Samrat Restaurant",
        image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&q=80",
        cuisines: ["North Indian", "Gujarati", "Thali"],
        rating: 4.5,
        ratingCount: 120,
        deliveryTime: "25-30 min",
        priceRange: "₹300 for two",
        address: {
            street: "Samrat Nagar, Modhera Char rasta",
            city: "Mahesana",
            coordinates: { lat: 23.5880, lon: 72.3693 }
        },
        aggregatedDiscountInfoV3: {
            header: "20% OFF",
            subHeader: "UPTO ₹50"
        },
        isOpen: true
    },
    {
        name: "Gujarat Thali House",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80",
        cuisines: ["Gujarati", "Desserts"],
        rating: 4.2,
        ratingCount: 85,
        deliveryTime: "30-40 min",
        priceRange: "₹200 for two",
        address: {
            street: "Mahesana Taluka",
            city: "Mahesana",
            coordinates: { lat: 23.6000, lon: 72.4000 }
        },
        aggregatedDiscountInfoV3: {
            header: "Free Delivery",
            subHeader: ""
        },
        isOpen: true
    },
    {
        name: "Pizza Point Mahesana",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
        cuisines: ["Pizza", "Fast Food"],
        rating: 3.8,
        ratingCount: 50,
        deliveryTime: "40-50 min",
        priceRange: "₹400 for two",
        address: {
            street: "Modhera Road",
            city: "Mahesana",
            coordinates: { lat: 23.5900, lon: 72.3800 }
        },
        isOpen: true
    }
];

const seedRestaurants = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB...");

        // Check if they exist to avoid duplicates (by name)
        for (const r of mockRestaurants) {
            const existing = await Restaurant.findOne({ name: r.name });
            if (existing) {
                console.log(`Updated ${r.name}`);
                Object.assign(existing, r);
                await existing.save();
            } else {
                await Restaurant.create(r);
                console.log(`Created ${r.name}`);
            }
        }

        console.log("Done! Mahesana Restaurants are active.");
        process.exit();
    } catch (error) {
        console.error("Error seeding:", error);
        process.exit(1);
    }
};

seedRestaurants();
