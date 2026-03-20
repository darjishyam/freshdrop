const mongoose = require('mongoose');
require('dotenv').config();

const restaurantSchema = new mongoose.Schema({
    name: String,
    address: {
        street: String,
        city: String,
        zip: String,
        coordinates: {
            lat: Number,
            lon: Number
        }
    },
    status: String,
    isOpen: Boolean,
    operatingHours: Object
}, { strict: false });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

async function viewHeer() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://FreshDrop:FreshDrop123@cluster0.p2x8p.mongodb.net/FreshDrop?retryWrites=true&w=majority');

        const heer = await Restaurant.findOne({ name: /Heer/i });
        if (heer) {
            
            
            
            
            
            
            
            
        } else {
            
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

viewHeer();
