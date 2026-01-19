const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    flatNumber: String,
    street: {
      type: String,
      required: true,
    },
    landmark: String,
    city: {
      type: String,
      required: true,
    },
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lon: Number,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
