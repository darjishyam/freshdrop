const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: String,
        image: { type: String, required: true },
        // Discount details (from approved request)
        discountType: {
            type: String,
            enum: ["percentage", "flat", "free_item", "none"],
            default: "none",
        },
        discountValue: { type: Number, default: 0 },
        discountOn: { type: String, default: "All Items" },
        minOrderAmount: { type: Number, default: 0 },
        validUntil: { type: Date, default: null },
        // Link Type determines what happens when clicked
        linkType: {
            type: String,
            enum: ["Restaurant", "Category", "Web", "None"],
            default: "None",
        },
        linkId: { type: String, default: null },
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: "BannerRequest", default: null },
        expiresAt: { type: Date, default: null },
        isActive: { type: Boolean, default: true },
        priority: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);

