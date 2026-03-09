const Banner = require("../models/Banner");
const Restaurant = require("../models/Restaurant");

// Helper: Calculate distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// @desc    Get all banners (Admin)
// @route   GET /api/admin/banners
// @access  Private/Admin
const getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find({}).sort({ priority: -1, createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a banner
// @route   POST /api/admin/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
    try {
        const { title, description, image, linkType, linkId, isActive, priority } = req.body;

        const banner = new Banner({
            title,
            description,
            image,
            linkType,
            linkId,
            isActive,
            priority
        });

        const savedBanner = await banner.save();
        res.status(201).json(savedBanner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a banner
// @route   PUT /api/admin/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
    try {
        const updatedBanner = await Banner.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedBanner) return res.status(404).json({ message: "Banner not found" });
        res.json(updatedBanner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a banner
// @route   DELETE /api/admin/banners/:id
// @access  Private/Admin
const BannerRequest = require("../models/BannerRequest");

const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ message: "Banner not found" });

        // If this banner was created from a request, mark the request as deleted
        if (banner.requestId) {
            await BannerRequest.findByIdAndUpdate(banner.requestId, { status: "deleted" });
        }

        res.json({ message: "Banner deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active banners (Public - User App)
// @route   GET /api/external/banners
// @access  Public
const getActiveBanners = async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const now = new Date();
        const banners = await Banner.find({
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: now } }
            ]
        }).sort({ priority: -1, createdAt: -1 });

        // Record views for tracking performance
        if (banners.length > 0) {
            const bannerIds = banners.map(b => b._id);
            await Banner.updateMany({ _id: { $in: bannerIds } }, { $inc: { views: 1 } });
        }

        // If no coordinates, return all (fallback)
        if (!lat || !lon) {
            return res.json(banners);
        }

        const filteredBanners = [];

        for (const banner of banners) {
            // Logic: If it's a restaurant banner, check proximity
            if (banner.linkType === 'Restaurant' && banner.linkId) {
                try {
                    const restaurant = await Restaurant.findById(banner.linkId);
                    if (restaurant && restaurant.address?.coordinates) {
                        const dist = calculateDistance(
                            parseFloat(lat),
                            parseFloat(lon),
                            restaurant.address.coordinates.lat,
                            restaurant.address.coordinates.lon
                        );

                        // Limit to 15km radius for banners
                        if (dist <= 15) {
                            filteredBanners.push(banner);
                        }
                    }
                } catch (err) {
                    console.error("Banner restaurant lookup error:", err);
                    // If restaurant not found, don't show the banner
                }
            } else {
                // Non-restaurant banners (Category, Web, etc.) are global for now
                filteredBanners.push(banner);
            }
        }

        res.json(filteredBanners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const recordBannerClick = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } }, { new: true });
        if (!banner) return res.status(404).json({ message: "Banner not found" });
        res.json({ message: "Click recorded", clicks: banner.clicks });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    getActiveBanners,
    recordBannerClick
};
