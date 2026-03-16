const mongoose = require('mongoose');
const Review = require('./models/Review');
const Restaurant = require('./models/Restaurant');
const User = require('./models/User');
require('dotenv').config();

async function seedReviews() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const restaurants = await Restaurant.find({ name: { $in: ['Heer Restaurant', 'Pratibha Restaurant', 'Sampatti Restaurant'] } });
    const user = await User.findOne({ email: 'shyamdarji1604@gmail.com' }) || await User.findOne();

    if (!user) {
        console.log('❌ No user found to associate reviews with');
        await mongoose.disconnect();
        return;
    }

    const mockReviews = [
        { rating: 5, comment: "Amazing food! The Vadapav was authentic and spicy. Highly recommended." },
        { rating: 4, comment: "Good taste and quick delivery. Really enjoyed the Rasmalai." },
        { rating: 5, comment: "Best restaurant in Panchot! The Chicken Burger is a must-try." },
        { rating: 3, comment: "Food was okay, but delivery took a bit longer than expected." }
    ];

    for (const rest of restaurants) {
        // Remove old reviews for these restaurants to start fresh
        await Review.deleteMany({ restaurant: rest._id });

        let totalPoints = 0;
        for (const rev of mockReviews) {
            await Review.create({
                user: user._id,
                restaurant: rest._id,
                rating: rev.rating,
                comment: rev.comment,
                userName: user.name || "Shyam",
                userImage: user.image
            });
            totalPoints += rev.rating;
        }

        const avg = (totalPoints / mockReviews.length).toFixed(1);
        await Restaurant.findByIdAndUpdate(rest._id, {
            rating: avg,
            ratingCount: mockReviews.length
        });
        console.log(`⭐ Seeded 4 reviews for ${rest.name} (Avg: ${avg})`);
    }

    await mongoose.disconnect();
    console.log('🎉 Done!');
}

seedReviews().catch(console.error);
