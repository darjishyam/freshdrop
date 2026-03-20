const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function fixImages() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        

        // New URLs that definitely exist
        const newAttaImg = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"; // Bread/flour generic
        const newPotatoImg = "https://images.unsplash.com/photo-1508313880080-c4bef073039d?w=400"; // Sweet potatoes/potatoes

        const attaRes = await Product.updateMany(
            { merchantType: 'Grocery', name: { $regex: /Atta/i } },
            { $set: { image: newAttaImg } }
        );

        const potatoRes = await Product.updateMany(
            { merchantType: 'Grocery', name: { $regex: /Potatoes/i } },
            { $set: { image: newPotatoImg } }
        );

        

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

fixImages();
