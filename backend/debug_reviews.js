const mongoose = require("mongoose");
const Review = require("./models/Review");
const dotenv = require("dotenv");

dotenv.config();

const debugReviews = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        const reviews = await Review.find({});
        console.log("Total Reviews:", reviews.length);
        const fs = require('fs');
        fs.writeFileSync('reviews_dump.json', JSON.stringify(reviews, null, 2));
        console.log("Dumped to reviews_dump.json");

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

debugReviews();
