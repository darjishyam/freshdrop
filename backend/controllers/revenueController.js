const BannerRequest = require("../models/BannerRequest");
const BannerTier = require("../models/BannerTier");

// @desc    Get revenue statistics for Admin
// @route   GET /api/banner-requests/revenue/stats
// @access  Private/Admin
const getRevenueStats = async (req, res) => {
    try {
        const paidRequests = await BannerRequest.find({ paymentStatus: 'completed' });
        const tiers = await BannerTier.find({});

        // Map tiers for easy lookup
        const tierMap = {};
        tiers.forEach(t => tierMap[t.key] = t.price);

        const stats = {
            totalRevenue: 0,
            tierBreakdown: {},
            totalCompleted: paidRequests.length,
            averageRevenue: 0
        };

        // Initialize breakdown with 0s for all known tiers
        tiers.forEach(t => {
            stats.tierBreakdown[t.key] = 0;
        });

        paidRequests.forEach(req => {
            const amount = tierMap[req.promotionTier] || 0;
            stats.totalRevenue += amount;

            if (stats.tierBreakdown[req.promotionTier] !== undefined) {
                stats.tierBreakdown[req.promotionTier] += amount;
            } else {
                stats.tierBreakdown[req.promotionTier] = amount;
            }
        });

        if (stats.totalCompleted > 0) {
            stats.averageRevenue = Math.round(stats.totalRevenue / stats.totalCompleted);
        }

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRevenueStats
};
