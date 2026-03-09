const express = require('express');
const router = express.Router();
const {
    submitBannerRequest,
    getMyBannerRequests,
    getAllBannerRequests,
    updateBannerRequestStatus,
    payBannerRequest
} = require('../controllers/bannerRequestController');
const { getRevenueStats } = require('../controllers/revenueController');
const { protect: protectRestaurant } = require('../middleware/restaurantAuthMiddleware');
const { protect: protectAdmin } = require('../middleware/authMiddleware'); // Assuming this exists for Admin

// Restaurant Routes
router.post('/request', protectRestaurant, submitBannerRequest);
router.get('/my-requests', protectRestaurant, getMyBannerRequests);
router.put('/pay/:id', protectRestaurant, payBannerRequest);

// Admin Analytics
router.get('/revenue/stats', protectAdmin, getRevenueStats);

module.exports = router;
