const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    product: {
      // Optional: Review specific product
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    productName: {
      type: String, // Store product name for easier filtering/mock items
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    userName: String, // Cached name for display
    userImage: String, // Cached image for display
    images: [
      {
        type: String, // URL
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
