const BannerRequest = require("../models/BannerRequest");
const Banner = require("../models/Banner");
const BannerTier = require("../models/BannerTier");

// @desc    Submit a banner request
// @route   POST /api/banner-requests/request
// @access  Private/Restaurant
const submitBannerRequest = async (req, res) => {
    try {
        const {
            title, description, image, linkType, linkId, priority,
            discountType, discountValue, discountOn, minOrderAmount, validUntil,
            promotionTier, durationDays
        } = req.body;

        const restaurantId = req.user?._id;

        if (!restaurantId) {
            return res.status(401).json({ message: "Not authorized as restaurant" });
        }

        const bannerRequest = new BannerRequest({
            restaurantId,
            title,
            description,
            image,
            linkType: linkType || "Restaurant",
            linkId: linkId || restaurantId.toString(),
            priority: priority || 0,
            discountType: discountType || "none",
            discountValue: discountValue || 0,
            discountOn: discountOn || "All Items",
            minOrderAmount: minOrderAmount || 0,
            validUntil: validUntil || null,
            promotionTier: promotionTier || "basic",
            durationDays: durationDays || 3,
        });

        const savedRequest = await bannerRequest.save();
        res.status(201).json(savedRequest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get my banner requests
// @route   GET /api/banner-requests/my-requests
// @access  Private/Restaurant
const getMyBannerRequests = async (req, res) => {
    try {
        const restaurantId = req.user?._id;
        const requests = await BannerRequest.find({ restaurantId }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all banner requests (Admin)
// @route   GET /api/admin/banners/requests
// @access  Private/Admin
const getAllBannerRequests = async (req, res) => {
    try {
        const requests = await BannerRequest.find({})
            .populate("restaurantId", "name location cuisineType")
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update banner request status (Admin)
// @route   PUT /api/admin/banners/requests/:id
// @access  Private/Admin
const updateBannerRequestStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const request = await BannerRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Banner request not found" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: "Request already processed" });
        }

        request.status = status;
        if (status === "rejected") {
            request.rejectionReason = rejectionReason || "Does not meet quality standards";
        }

        if (status === "approved") {
            // Fetch tier config for dynamic days and priority
            const tier = await BannerTier.findOne({ key: request.promotionTier });
            const duration = tier ? tier.durationDays : (request.durationDays || 3);
            const tierPriority = tier ? tier.priority : 0;

            // Calculate expiry date
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + duration);

            // Determine priority: use request priority or tier default (whichever is higher)
            const priority = Math.max(request.priority || 0, tierPriority);

            // Create the actual banner with all discount and promotion fields
            const newBanner = new Banner({
                title: request.title,
                description: request.description,
                image: request.image,
                linkType: request.linkType,
                linkId: request.linkId,
                priority: priority,
                isActive: true,
                discountType: request.discountType,
                discountValue: request.discountValue,
                discountOn: request.discountOn,
                minOrderAmount: request.minOrderAmount,
                validUntil: request.validUntil,
                requestId: request._id,
                expiresAt: expiresAt,
            });
            await newBanner.save();

            // Apply discount to the Restaurant if applicable
            if (request.linkType === 'Restaurant' && request.linkId && request.discountType !== 'none') {
                const Restaurant = require('../models/Restaurant');
                const restaurant = await Restaurant.findById(request.linkId);

                if (restaurant) {
                    if (request.discountType === 'percentage') {
                        restaurant.discountPercent = request.discountValue || 0;
                        restaurant.minOrderValue = request.minOrderAmount || 0;
                        restaurant.maxDiscount = 150; // default cap since it's not collected in the banner form
                        restaurant.discount = `${request.discountValue}% OFF`;
                    } else if (request.discountType === 'flat') {
                        restaurant.discountPercent = 0;
                        restaurant.minOrderValue = request.minOrderAmount || 0;
                        restaurant.discount = `₹${request.discountValue} OFF`;
                    } else if (request.discountType === 'free_item') {
                        restaurant.discountPercent = 0;
                        restaurant.minOrderValue = request.minOrderAmount || 0;
                        restaurant.discount = `Free Item`;
                    }
                    await restaurant.save();
                }
            }
        }

        const updatedRequest = await request.save();
        res.json(updatedRequest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Pay for banner request
// @route   PUT /api/banner-requests/pay/:id
// @access  Private/Restaurant
const payBannerRequest = async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        const request = await BannerRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Banner request not found" });
        }

        request.paymentStatus = 'completed';
        request.paymentMethod = paymentMethod || 'gpay';

        const updatedRequest = await request.save();
        res.json(updatedRequest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    submitBannerRequest,
    getMyBannerRequests,
    getAllBannerRequests,
    updateBannerRequestStatus,
    payBannerRequest,
};
