const mongoose = require('mongoose');
const Product = require('./models/Product');
const Grocery = require('./models/Grocery');
require('dotenv').config();

async function fixGroceries() {
    try {
        await mongoose.connect(process.env.MONGO_URI);


        const stores = await Grocery.find({ name: { $in: ['Basket Mart', 'Kariyana Store'] } });

        if (stores.length === 0) {

            return;
        }

        const items = [
            { name: "Amul Gold Milk", price: 33, unit: "ml", weight: "500", category: "Dairy", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
            { name: "Fresh Brown Bread", price: 45, unit: "pack", weight: "1", category: "Bakery", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
            { name: "Fortune Oil", price: 145, unit: "l", weight: "1", category: "Staples", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
            { name: "Aashirvaad Atta", price: 210, unit: "kg", weight: "5", category: "Staples", image: "https://images.unsplash.com/photo-1590127879196-1c873fefbcee?w=400" },
            { name: "Tata Salt", price: 25, unit: "kg", weight: "1", category: "Staples", image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400" },
            { name: "Fresh Potatoes", price: 40, unit: "kg", weight: "1", category: "Vegetables", image: "https://images.unsplash.com/photo-1518977676601-b53f02bad675?w=400" },
            { name: "Red Onions", price: 35, unit: "kg", weight: "1", category: "Vegetables", image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=400" },
            { name: "Maggi Noodles", price: 14, unit: "g", weight: "70", category: "Snacks", image: "https://images.unsplash.com/photo-1612927641991-660c9df7642f?w=400" },
            { name: "Lay's Chips", price: 20, unit: "g", weight: "50", category: "Snacks", image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400" },
            { name: "Coca Cola", price: 40, unit: "ml", weight: "500", category: "Beverages", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" }
        ];

        for (const store of stores) {


            // Delete any existing items for this store in the MAIN Product collection
            await Product.deleteMany({ restaurant: store._id });

            const storeItems = items.map(item => ({
                ...item,
                merchantType: 'Grocery',
                restaurant: store._id,
                inStock: true,
                isVeg: true
            }));

            await Product.insertMany(storeItems);

        }

        // Cleanup the mistaken collection

        await mongoose.connection.db.dropCollection('groceryproducts').catch(() => { });


        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

fixGroceries();
