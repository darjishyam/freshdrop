const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  googleLogin,
  updateProfile,
  getProfile,
  resetPassword,
  requestProfileUpdateOtp,
  verifyProfileUpdateOtp,
  addToHistory,
  updatePushToken,
  removePushToken,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);
router.post("/google", googleLogin);
router.put("/profile", protect, updateProfile);
router.get("/profile", protect, getProfile);
router.post("/reset-password", resetPassword);
router.post("/profile/otp/request", requestProfileUpdateOtp);
router.post("/profile/otp/verify", verifyProfileUpdateOtp);
router.post("/profile/history", protect, addToHistory);
router.put("/push-token", protect, updatePushToken);
router.delete("/push-token", protect, removePushToken);

module.exports = router;
