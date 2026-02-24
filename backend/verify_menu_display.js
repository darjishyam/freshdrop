const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Find Restaurant
        const r = await Restaurant.findOne({ email: { $regex: /sampat/i } });
        if (!r) {
            console.error("Restaurant not found");
            process.exit(1);
        }
        console.log(`Restaurant: ${r.name} (${r._id})`);

        // 2. Find Products
        const products = await Product.find({ restaurant: r._id });
        console.log(`Products Found: ${products.length}`);

        if (products.length === 0) {
            console.error("FAIL: No products found! Menu will be empty.");
            // Optional: seed if missing?
        } else {
            console.log("PASS: Menu items exist.");
            products.forEach(p => console.log(` - ${p.name} (₹${p.price})`));
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verify();
