const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updatePushToken, logout, updateProfile, uploadRestaurantDocuments, requestOtp, verifyOtp, requestGroceryOtp, verifyGroceryOtp } = require('../controllers/restaurantAuthController');
const { protect } = require('../middleware/restaurantAuthMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/request-grocery-otp', requestGroceryOtp);
router.post('/verify-grocery-otp', verifyGroceryOtp);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/upload-documents', protect, uploadRestaurantDocuments);
router.put('/push-token', protect, updatePushToken);
router.post('/logout', protect, logout);

module.exports = router;
