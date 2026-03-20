const mongoose = require('mongoose');
const Restaurant = require('./backend/models/Restaurant');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, './backend/.env') });

const checkId = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        

        // Check for the specific ID from logs
        const targetId = '6998417c61c1f9d16ca539b6';
        const restaurant = await Restaurant.findById(targetId);

        if (restaurant) {
            
            
            
            
        } else {
            

            // List all grocery stores to see what's available
            const allGroceries = await Restaurant.find({ storeType: 'GROCERY' });
            
            allGroceries.forEach(g => {
                
            });

            // List all Approved restaurants
            const allApproved = await Restaurant.find({ status: 'APPROVED' });
            
        }

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkId();
