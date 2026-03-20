const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function testDelete() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        

        // Find a grocery item
        const item = await Product.findOne({ merchantType: 'Grocery' });

        if (!item) {
            
            return;
        }

        

        // Try to delete directly
        const deletedItem = await Product.findByIdAndDelete(item._id);

        if (deletedItem) {
            
            // Put it back to not ruin the data
            await Product.create(item.toObject());
            
        } else {
            
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

testDelete();
