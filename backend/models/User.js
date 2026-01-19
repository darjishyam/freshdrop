const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple users to have no email
    },
    password: {
      type: String, // Optional for Google Users
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // Optional initially, but unique if present
    },
    googleId: {
      type: String, // Unique ID from Google
    },
    image: {
      type: String, // Profile Picture
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Temporary storage for verifying profile updates (email/phone)
    tempUpdate: {
      field: String, // 'email' or 'phone'
      value: String,
      otp: String,
      otpExpires: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
