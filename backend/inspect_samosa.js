const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Find Samosa
        const samosa = await Product.findOne({ name: { $regex: /samosa/i } });
        if (!samosa) {
            console.log("Samosa not found in Products!");
            process.exit(1);
        }

        console.log("Samosa Details:");
        console.log(`Name: ${samosa.name}`);
        console.log(`Price: ${samosa.price}`);
        console.log(`Category: ${samosa.category}`);
        console.log(`Image: ${samosa.image}`);
        console.log(`IsVeg: ${samosa.isVeg}`);
        console.log(`InStock: ${samosa.inStock}`);
        console.log(`Restaurant ID: ${samosa.restaurant}`);

        // 2. Check Restaurant Link
        const restId = samosa.restaurant;
        console.log(`Linked Restaurant ID: ${restId} (Type: ${typeof restId})`);

        const rest = await Restaurant.findById(restId);
        if (rest) {
            console.log(`Linked Restaurant Name: ${rest.name}`);
            console.log(`Restaurant ID: ${rest._id}`);
        } else {
            console.error("FAIL: Linked Restaurant NOT FOUND!");
        }

        // 3. Check for specific fields used in frontend
        if (!samosa.image) console.warn("WARNING: Image is missing");
        if (!samosa.price) console.warn("WARNING: Price is missing");
        if (!samosa.category) console.warn("WARNING: Category is missing");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspect();
