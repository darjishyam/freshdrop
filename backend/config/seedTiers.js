const BannerTier = require('../models/BannerTier');

const seedBannerTiers = async () => {
    try {
        const count = await BannerTier.countDocuments();
        if (count === 0) {
            const tiers = [
                {
                    name: 'Basic',
                    key: 'basic',
                    price: 0,
                    durationDays: 3,
                    priority: 0,
                    color: '#888',
                    benefits: '3 Days Duration'
                },
                {
                    name: 'Pro Boost',
                    key: 'pro',
                    price: 499,
                    durationDays: 7,
                    priority: 5,
                    color: '#FC8019',
                    benefits: '7 Days • Medium Boost'
                },
                {
                    name: 'Elite Pro',
                    key: 'elite',
                    price: 999,
                    durationDays: 15,
                    priority: 10,
                    color: '#7B1FA2',
                    benefits: '15 Days • Max Visibility'
                }
            ];
            await BannerTier.insertMany(tiers);
            console.log('✅ Default Banner Tiers seeded');
        }
    } catch (error) {
        console.error('❌ Error seeding Banner Tiers:', error);
    }
};

module.exports = seedBannerTiers;
