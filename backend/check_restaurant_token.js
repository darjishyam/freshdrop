const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const restaurantSchema = new mongoose.Schema({
    title: { type: String },
    name: { type: String },
    pushToken: { type: String },
}, { strict: false });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

const checkToken = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // The ID from the user's logs
        const restaurantId = '699697167108542843ddf274';
        const restaurant = await Restaurant.findById(restaurantId);

        if (restaurant) {
            console.log('Restaurant Found:', restaurant.name || restaurant.title);
            console.log('Push Token:', restaurant.pushToken ? restaurant.pushToken : 'NULL/UNDEFINED');
        } else {
            console.log('Restaurant NOT found with ID:', restaurantId);
        }

        // Also list any restaurant with a token, just in case
        const withToken = await Restaurant.findOne({ pushToken: { $exists: true, $ne: null } });
        if (withToken) {
            console.log('Example Check - Found A restaurant with token:', withToken.name, withToken.pushToken);
        } else {
            console.log('Example Check - No restaurants have push tokens.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkToken();
