const mongoose = require('mongoose');
const Restaurant = require('./backend/models/Restaurant');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, './backend/.env') });

const checkId = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Check for the specific ID from logs
        const targetId = '6998417c61c1f9d16ca539b6';
        const restaurant = await Restaurant.findById(targetId);

        if (restaurant) {
            console.log('✅ Found Restaurant:');
            console.log('   Name:', restaurant.name);
            console.log('   Type:', restaurant.storeType);
            console.log('   Status:', restaurant.status);
        } else {
            console.log('❌ Restaurant not found with ID:', targetId);

            // List all grocery stores to see what's available
            const allGroceries = await Restaurant.find({ storeType: 'GROCERY' });
            console.log(`\nAvailable Grocery Stores (${allGroceries.length}):`);
            allGroceries.forEach(g => {
                console.log(` - ${g.name} (${g._id}) [Status: ${g.status}]`);
            });

            // List all Approved restaurants
            const allApproved = await Restaurant.find({ status: 'APPROVED' });
            console.log(`\nTotal Approved Partners (All types): ${allApproved.length}`);
        }

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkId();
