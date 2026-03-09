const mongoose = require('mongoose');

const bannerTierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    durationDays: {
        type: Number,
        required: true,
        default: 3
    },
    priority: {
        type: Number,
        required: true,
        default: 0
    },
    color: {
        type: String,
        default: '#888'
    },
    benefits: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('BannerTier', bannerTierSchema);
