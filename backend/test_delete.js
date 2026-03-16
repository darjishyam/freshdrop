const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function testDelete() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find a grocery item
        const item = await Product.findOne({ merchantType: 'Grocery' });

        if (!item) {
            console.log("No grocery item found to test delete on.");
            return;
        }

        console.log(`Found item testing delete with ID: ${item._id}`);

        // Try to delete directly
        const deletedItem = await Product.findByIdAndDelete(item._id);

        if (deletedItem) {
            console.log(`Successfully deleted ${item.name} (${item._id})`);
            // Put it back to not ruin the data
            await Product.create(item.toObject());
            console.log("Restored item back into DB.");
        } else {
            console.log("Failed to delete item - not found.");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

testDelete();
