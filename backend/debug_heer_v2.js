const mongoose = require('mongoose');
const path = require('path');
const Restaurant = require(path.join(__dirname, './models/Restaurant'));
const dotenv = require('dotenv');

dotenv.config();

const checkRestaurant = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/freshdrop');
        console.log('DB Connected.');

        const r = await Restaurant.findOne({ email: 'heer@gmail.com' });
        if (!r) {
            console.log("Restaurant not found.");
            process.exit(0);
        }

        console.log("Validating restaurant document...");
        const validationError = r.validateSync();

        if (validationError) {
            console.log("Validation Errors found:");
            Object.keys(validationError.errors).forEach(key => {
                console.log(`- Field '${key}': ${validationError.errors[key].message}`);
            });
        } else {
            console.log("No synchronous validation errors.");
            try {
                console.log("Attempting save...");
                await r.save();
                console.log("Save successful!");
            } catch (saveErr) {
                console.error("Save failed (async):", saveErr.message);
                if (saveErr.errors) {
                    Object.keys(saveErr.errors).forEach(key => {
                        console.log(`- Field '${key}': ${saveErr.errors[key].message}`);
                    });
                }
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
};

checkRestaurant();
