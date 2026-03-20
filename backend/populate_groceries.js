const mongoose = require('mongoose');
require('dotenv').config();

const groceryProductSchema = new mongoose.Schema({
    grocery: { type: mongoose.Schema.Types.ObjectId, ref: 'Grocery', required: true },
    name: { type: String, required: true },
    image: String,
    price: Number,
    discount: { type: Number, default: 0 },
    category: String,
    unit: String,
    inStock: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    votes: { type: Number, default: 0 },
    isBestSeller: { type: Boolean, default: false },
    isOrganic: { type: Boolean, default: false },
    tags: [String]
}, { timestamps: true });

const GroceryProduct = mongoose.model('GroceryProduct', groceryProductSchema);
const Grocery = require('./models/Grocery');

async function populateGroceries() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        

        // Find the empty stores
        const stores = await Grocery.find({ name: { $in: ['Basket Mart', 'Kariyana Store'] } });

        if (stores.length === 0) {
            
            return;
        }

        const items = [
            // Dairy & Bakery
            { name: "Amul Gold Cream Milk", price: 33, unit: "500ml", category: "Dairy", image: "https://images.unsplash.com/photo-1550583724-123ad2d1f0b0?w=200" },
            { name: "White Bread", price: 45, unit: "1 unit", category: "Bakery", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200" },
            { name: "Fresh Eggs (Pack of 6)", price: 60, unit: "6 pieces", category: "Dairy", image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=200" },

            // Staples
            { name: "Fortune Soyabean Oil", price: 145, unit: "1L", category: "Staples", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200" },
            { name: "Aashirvaad Atta", price: 210, unit: "5kg", category: "Staples", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200" },
            { name: "Tata Salt", price: 25, unit: "1kg", category: "Staples", image: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=200" },

            // Vegetables
            { name: "Fresh Potato (Aloo)", price: 40, unit: "1kg", category: "Vegetables", image: "https://images.unsplash.com/photo-1518977676601-b53f02bad675?w=200" },
            { name: "Desi Onion (Pyaz)", price: 35, unit: "1kg", category: "Vegetables", image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=200" },

            // Snacks
            { name: "Maggi 2-Minute Noodles", price: 14, unit: "70g", category: "Snacks", image: "https://images.unsplash.com/photo-1612927641991-660c9df7642f?w=200" },
            { name: "Lay's Classic Salted", price: 20, unit: "50g", category: "Snacks", image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200" }
        ];

        for (const store of stores) {
            

            // Set categories for store
            store.menuCategories = ["Dairy", "Bakery", "Staples", "Vegetables", "Snacks"];
            await store.save();

            // Clear old items for this store
            await GroceryProduct.deleteMany({ grocery: store._id });

            const storeItems = items.map(item => ({
                ...item,
                grocery: store._id,
                inStock: true
            }));

            await GroceryProduct.insertMany(storeItems);
            
        }

        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

populateGroceries();
