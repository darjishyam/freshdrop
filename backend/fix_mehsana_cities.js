const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

async function fixCities() {
    try {
        await mongoose.connect('mongodb+srv://professor:CQ33cuFBo1SoplWf@cluster0.9zk2jrk.mongodb.net/freshdrop?retryWrites=true&w=majority');
        console.log('Connected to DB');

        // Mehsana bounding box (approx 20km)
        const filter = {
            'address.coordinates.lat': { $gt: 23.4, $lt: 23.8 },
            'address.coordinates.lon': { $gt: 72.2, $lt: 72.6 }
        };

        const result = await Restaurant.updateMany(filter, {
            $set: { 'address.city': 'Mehsana' }
        });

        console.log(`Successfully updated ${result.modifiedCount} restaurants to 'Mehsana'.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixCities();
