const mongoose = require("mongoose");
const Review = require("./models/Review");
const dotenv = require("dotenv");

dotenv.config();

const clearReviews = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        const result = await Review.deleteMany({});
        console.log(`Deleted ${result.deletedCount} reviews.`);

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

clearReviews();
