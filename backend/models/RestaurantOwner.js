const mongoose = require("mongoose");

const restaurantOwnerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        otp: {
            type: String,
        },
        otpExpires: {
            type: Date,
        },
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("RestaurantOwner", restaurantOwnerSchema);
