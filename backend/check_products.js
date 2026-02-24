const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();

const checkProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const r = await Restaurant.findOne({ email: 'Sampat@gmail.com' });
        if (!r) {
            console.log("Restaurant not found");
            process.exit(1);
        }

        const products = await Product.find({ restaurant: r._id });
        console.log(`Restaurant: ${r.name} (${r._id})`);
        console.log(`Product Count: ${products.length}`);

        if (products.length > 0) {
            products.forEach(p => console.log(` - ${p.name} (${p.price})`));
        } else {
            console.log("NO PRODUCTS FOUND. User cannot order.");
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkProducts();
