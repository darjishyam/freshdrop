const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const MONGO_URI = "mongodb+srv://professor:CQ33cuFBo1SoplWf@cluster0.9zk2jrk.mongodb.net/freshdrop?retryWrites=true&w=majority";

async function checkPizza() {
    await mongoose.connect(MONGO_URI);
    const pizza = await Product.findOne({ name: /Pizza/i });
    console.log('Pizza Product:', JSON.stringify(pizza, null, 2));
    process.exit(0);
}

checkPizza();
