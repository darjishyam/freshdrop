const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const Product = require("./models/Product");
require("dotenv").config();

const restoreData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        

        // 1. Remove ONLY the seeded restaurants we created earlier
        // We'll filter by name or specific criteria to avoid touching anything else
        const seedNames = ["Pizza Hut", "McDonald's", "Domino's Pizza", "Fresh Mart Grocery", "KFC", "Swiggy Test - Mehsana"];
        
        await Restaurant.deleteMany({ name: { $in: seedNames } });

        // Also remove products belonging to these (or dangling ones)
        // For simplicity in this restoration, we'll clear products to re-link correctly
        await Product.deleteMany({});

        
        const mehsanaCoords = { lat: 23.5880, lon: 72.3693 };

        const userRestaurants = [
            {
                name: "Pratibha Restaurant",
                email: "pratibha@example.com",
                ownerName: "Pratibha Owner",
                image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
                rating: 4.5,
                ratingCount: 150,
                deliveryTime: "20-30 min",
                priceRange: "₹300 for two",
                cuisines: ["North Indian", "Gujarati", "Punjabi"],
                address: {
                    street: "Modhera Road",
                    city: "Mehsana",
                    coordinates: mehsanaCoords,
                },
                isOpen: true,
                status: "APPROVED",
            },
            {
                name: "Sampatti Restaurant",
                email: "sampatti@example.com",
                ownerName: "Sampatti Owner",
                image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500",
                rating: 4.8,
                ratingCount: 200,
                deliveryTime: "15-25 min",
                priceRange: "₹400 for two",
                cuisines: ["Indian", "Chinese", "Fast Food"],
                address: {
                    street: "Nagarpalika Road",
                    city: "Mehsana",
                    coordinates: mehsanaCoords,
                },
                isOpen: true,
                status: "APPROVED",
            },
            {
                name: "New Restaurant",
                email: "newrest@example.com",
                ownerName: "New Owner",
                image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500",
                rating: 4.0,
                ratingCount: 50,
                deliveryTime: "30-40 min",
                priceRange: "₹250 for two",
                cuisines: ["Snacks", "Street Food", "Beverages"],
                address: {
                    street: "Highway Road",
                    city: "Mehsana",
                    coordinates: mehsanaCoords,
                },
                isOpen: true,
                status: "APPROVED",
            },
        ];

        const restaurants = await Restaurant.insertMany(userRestaurants);
        

        
        const products = [];

        // Add some products for each to make Home sections look good
        restaurants.forEach(rest => {
            products.push(
                {
                    restaurant: rest._id,
                    name: `${rest.name} Special Thali`,
                    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300",
                    price: 150,
                    description: "Full traditional meal with multiple courses",
                    category: "Thali",
                    isVeg: true,
                    rating: 4.9,
                    votes: 45,
                    isBestSeller: true,
                    quantityDetails: [{ quantity: "Serves 1" }],
                },
                {
                    restaurant: rest._id,
                    name: "Paneer Tikka Masala",
                    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300",
                    price: 180,
                    description: "Spicy roasted paneer in rich tomato gravy",
                    category: "Main Course",
                    isVeg: true,
                    rating: 4.7,
                    votes: 30,
                    quantityDetails: [{ quantity: "Serves 2" }],
                }
            );
        });

        await Product.insertMany(products);
        

        
        process.exit(0);
    } catch (err) {
        console.error("❌ Error during restoration:", err);
        process.exit(1);
    }
};

restoreData();
