const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

const checkRestaurant = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/freshdrop');
        console.log('DB Connected.');

        const r = await Restaurant.findOne({ email: 'heer@gmail.com' });
        if (!r) {
            console.log("Restaurant not found.");
        } else {
            console.log("Restaurant found:", JSON.stringify(r, null, 2));
            try {
                console.log("Testing save...");
                await r.save();
                console.log("Save successful!");
            } catch (saveErr) {
                console.error("Save failed:", saveErr);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkRestaurant();
