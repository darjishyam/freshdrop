const BannerTier = require('../models/BannerTier');

// @desc    Get all active banner tiers (Public/Restaurant)
// @route   GET /api/external/banner-tiers
const getActiveTiers = async (req, res) => {
    try {
        const tiers = await BannerTier.find({ isActive: true }).sort({ priority: 1 });
        res.json(tiers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all banner tiers (Admin)
// @route   GET /api/admin/banner-tiers
const getAllTiers = async (req, res) => {
    try {
        const tiers = await BannerTier.find({}).sort({ priority: 1 });
        res.json(tiers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a banner tier (Admin)
// @route   PUT /api/admin/banner-tiers/:id
const updateTier = async (req, res) => {
    try {
        const tier = await BannerTier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tier) return res.status(404).json({ message: "Tier not found" });
        res.json(tier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getActiveTiers,
    getAllTiers,
    updateTier
};
