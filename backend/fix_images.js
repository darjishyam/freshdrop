const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function fixImages() {
    await mongoose.connect(process.env.MONGO_URI);

    // Fix Vadapav image
    const result = await Product.updateMany(
        { name: { $regex: /vadapav/i } },
        { $set: { image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=300' } }
    );
    

    await mongoose.disconnect();
    
}

fixImages().catch(console.error);
