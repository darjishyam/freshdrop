const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updatePushToken, logout, updateProfile } = require('../controllers/restaurantAuthController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/push-token', updatePushToken);
router.post('/logout', logout);

module.exports = router;
