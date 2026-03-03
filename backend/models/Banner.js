const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: String,
        image: {
            type: String,
            required: true,
        },
        // Link Type determines what happens when clicked
        linkType: {
            type: String,
            enum: ["Restaurant", "Category", "Web", "None"],
            default: "None",
        },
        // ID of the restaurant/category or a full URL for 'Web' linkType
        linkId: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        priority: {
            type: Number,
            default: 0, // Higher numbers show up first
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
