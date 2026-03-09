const Coupon = require("../models/Coupon");
const mongoose = require("mongoose");

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Admin
exports.createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            maxDiscount,
            minOrderValue,
            expiresAt,
            usageLimit,
            perUserLimit,
            isActive,
        } = req.body;

        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ message: "Coupon code already exists" });
        }

        const coupon = new Coupon({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue,
            maxDiscount,
            minOrderValue,
            expiresAt,
            usageLimit,
            perUserLimit,
            isActive,
        });

        await coupon.save();
        res.status(201).json(coupon);
    } catch (error) {
        console.error("Create coupon error:", error);
        res.status(500).json({ message: "Server error creating coupon" });
    }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Admin
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json(coupons);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching coupons" });
    }
};

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Admin
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Never override usedCount and usersUsed via regular update
        delete updateData.usedCount;
        delete updateData.usersUsed;

        if (updateData.code) {
            updateData.code = updateData.code.toUpperCase();
        }

        const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        res.status(200).json(coupon);
    } catch (error) {
        res.status(500).json({ message: "Server error updating coupon" });
    }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Admin
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        res.status(200).json({ message: "Coupon deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error deleting coupon" });
    }
};

// @desc    Validate a coupon (Customer facing)
// @route   POST /api/coupons/validate
// @access  User (Protected)
exports.validateCoupon = async (req, res) => {
    try {
        let { code, cartTotal } = req.body;
        const userId = req.user._id;

        if (!code || cartTotal == null) {
            return res.status(400).json({ message: "Code and cartTotal are required" });
        }

        code = code.toUpperCase();
        const coupon = await Coupon.findOne({ code });

        if (!coupon) {
            return res.status(404).json({ message: "Coupon code not found" });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ message: "This coupon is no longer active" });
        }

        if (new Date(coupon.expiresAt) < new Date()) {
            return res.status(400).json({ message: "This coupon has expired" });
        }

        if (coupon.minOrderValue > cartTotal) {
            return res.status(400).json({ message: `Minimum order value of ₹${coupon.minOrderValue} required` });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: "Coupon usage limit reached" });
        }

        // Check if user has already used it too many times
        const userUses = coupon.usersUsed.filter(id => id.toString() === userId.toString()).length;
        if (userUses >= coupon.perUserLimit) {
            return res.status(400).json({ message: "You have already reached the usage limit for this coupon" });
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (coupon.discountType === "FLAT") {
            discountAmount = coupon.discountValue;
        } else if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (cartTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        }

        // Don't allow discount to be more than the cart total
        if (discountAmount > cartTotal) {
            discountAmount = cartTotal;
        }

        res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            discountAmount: Math.round(discountAmount),
            code: coupon.code
        });

    } catch (error) {
        console.error("Validate coupon error:", error);
        res.status(500).json({ message: "Server error validating coupon" });
    }
};
