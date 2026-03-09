const mongoose = require("mongoose");

const bannerRequestSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: String,
        image: {
            type: String,
            required: true,
        },
        // Discount details
        discountType: {
            type: String,
            enum: ["percentage", "flat", "free_item", "none"],
            default: "none",
        },
        discountValue: {
            type: Number,
            default: 0,
        },
        discountOn: {
            type: String,
            default: "All Items", // e.g. "All Items", "Biryani", "Pizza"
        },
        minOrderAmount: {
            type: Number,
            default: 0,
        },
        validUntil: {
            type: Date,
            default: null,
        },
        // Link: when customer taps banner, open this restaurant
        linkType: {
            type: String,
            enum: ["Restaurant", "Category", "Web", "None"],
            default: "Restaurant",
        },
        linkId: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "deleted"],
            default: "pending",
        },
        rejectionReason: {
            type: String,
            default: "",
        },
        priority: {
            type: Number,
            default: 0,
        },
        promotionTier: {
            type: String,
            enum: ["basic", "pro", "elite"],
            default: "basic",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "completed"],
            default: "pending",
        },
        durationDays: {
            type: Number,
            default: 3, // Default for basic
        },
        paymentMethod: {
            type: String,
            enum: ["gpay", "paytm", "phonepe", "free"],
            default: "free",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("BannerRequest", bannerRequestSchema);
