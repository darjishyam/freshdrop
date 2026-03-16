const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const Product = require("./models/Product");
const Category = require("./models/Category");
require("dotenv").config();

// Define reliable image URLs for categories and products
const categoryImages = {
    "Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
    "Pizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80",
    "Chicken": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=500&q=80",
    "Rolls & Wraps": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=500&q=80",
    "Desserts": "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=500&q=80",
    "Beverages": "https://images.unsplash.com/photo-1461023058943-0701ce514d02?auto=format&fit=crop&w=500&q=80",
    "Biryani": "https://images.unsplash.com/photo-1563379091339-03b2184f4f03?auto=format&fit=crop&w=500&q=80",
    "Breads": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80",
    "Main Course": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80",
    "Sides": "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=500&q=80"
};

const fixedFoodImages = {
    "Classic Cheeseburger": categoryImages["Burgers"],
    "Veggie Supreme Pizza": categoryImages["Pizza"],
    "Spicy Chicken Wings": categoryImages["Chicken"],
    "Paneer Tikka Wrap": categoryImages["Rolls & Wraps"],
    "Chocolate Lava Cake": categoryImages["Desserts"],
    "Cold Coffee with Ice Cream": categoryImages["Beverages"],
    "Chicken Biryani": categoryImages["Biryani"],
    "Butter Naan": categoryImages["Breads"],
    "Dal Makhani": categoryImages["Main Course"],
    "Crispy French Fries": categoryImages["Sides"],
    // For existing ones
    "Margherita Pizza": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80",
    "Pepperoni Pizza": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80",
    "Farmhouse Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
    "Gujarati Thali": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80"
};

const fixDatabase = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is not defined");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Create or update Categories
        console.log("📂 Creating/Updating Categories...");
        for (const [name, image] of Object.entries(categoryImages)) {
            await Category.findOneAndUpdate(
                { name: name },
                { name: name, image: image, type: "Food" },
                { upsert: true, returnDocument: 'after' }
            );
        }
        console.log("✅ Categories prepared successfully.");

        // 2. Fix Product Images
        console.log("🖼️ Fixing Product images...");
        // Use .lean() to avoid casting errors on mismatched legacy DB data (e.g. quantityDetails mismatch)
        const products = await Product.find({}).lean();
        let updatedCount = 0;

        for (const product of products) {
            if (fixedFoodImages[product.name]) {
                await Product.updateOne({ _id: product._id }, { $set: { image: fixedFoodImages[product.name] } });
                updatedCount++;
            } else if (categoryImages[product.category]) {
                await Product.updateOne({ _id: product._id }, { $set: { image: categoryImages[product.category] } });
                updatedCount++;
            }
        }
        console.log(`✅ Fixed images for ${updatedCount} products.`);

        console.log("🎉 Database fixes applied successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error fixing database:", err);
        process.exit(1);
    }
};

fixDatabase();
