const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Food", "Grocery", "Other"],
      default: "Food",
    },
    description: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
