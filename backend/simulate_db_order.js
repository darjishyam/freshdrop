const axios = require('axios');
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const User = require('./models/User'); // Need a user
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api/orders';

const simulate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Get Restaurant
        const r = await Restaurant.findOne({ email: 'Sampat@gmail.com' });
        if (!r) throw new Error("Restaurant not found");

        // 2. Get a User (or create dummy)
        let user = await User.findOne();
        if (!user) throw new Error("No user found in DB to place order");

        // 3. Get a Product
        const product = await Product.findOne({ restaurant: r._id });
        if (!product) throw new Error("No products found for restaurant");

        // 4. Login to get Token (Skip if we can mock or use a known token, 
        // but better to just mock the req.user in the controller if we were testing internally.
        // Since we are calling API, we need a token.
        // Actually, let's just use the `inspect_sampat` approach but strictly for the active orders check 
        // OR just rely on the user testing since obtaining a valid JWT token via script is tedious without credentials.

        // ALTERNATIVE: Direct DB Insertion + Manual Emit? 
        // No, that defeats the purpose of testing the controller.

        // Let's print the CURL command for the user to run, or try to login using a known test user if exists.
        // I will assume there is a test user 'test@test.com' / '123456' or similar. 
        // If not, I'll just check if I can create an order directly via code (invoking controller function?) 
        // No, that requires mocking req/res.

        // Let's just create a script that inserts an order into DB directly 
        // AND prints "Order Created". 
        // The frontend will pick it up via Valid API call 'fetchActiveOrders'. 
        // socket emission won't happen this way, but API check will work.

        console.log("Creating Manual Order in DB...");

        const Order = require('./models/Order');
        const newOrder = await Order.create({
            user: user._id,
            restaurant: r._id,
            items: [{
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image
            }],
            totalAmount: product.price + 40 + Math.round(product.price * 0.05),
            billDetails: {
                itemTotal: product.price,
                deliveryFee: 40,
                taxes: Math.round(product.price * 0.05),
                grandTotal: product.price + 40 + Math.round(product.price * 0.05)
            },
            paymentDetails: {
                method: 'COD',
                status: 'Pending'
            },
            deliveryAddress: {
                street: "123 Test St",
                city: "Mahesana",
                lat: 23.6,
                lon: 72.3
            },
            status: "Order Placed"
        });

        console.log(`Order Created: ${newOrder._id}`);
        console.log("Go to Restaurant App and refresh/open Orders tab. It should appear.");

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

simulate();
