const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const r = await Restaurant.findOne({ email: { $regex: /sampat/i } });
        if (!r) {
            console.log("Sampati restaurant not found!");
            process.exit(1);
        }

        console.log(`Found Restaurant: ${r.name}`);
        console.log(`Address:`, JSON.stringify(r.address, null, 2));

        const rLat = r.address?.coordinates?.lat;
        const rLon = r.address?.coordinates?.lon;

        console.log(`Extracted Coords: Lat=${rLat} (${typeof rLat}), Lon=${rLon} (${typeof rLon})`);

        // Test with SAME coordinates
        const dist = calculateDistance(rLat, rLon, rLat, rLon);
        console.log(`Distance from itself: ${dist} km`);

        // Test with slightly different coordinates (e.g. 100m away)
        // 0.001 deg is approx 111m
        const dist2 = calculateDistance(rLat + 0.001, rLon, rLat, rLon);
        console.log(`Distance from 111m away: ${dist2} km`);

        if (dist > 10) {
            console.error("FAIL: Restaurant is > 10km from itself! Logic error.");
        } else {
            console.log("PASS: Restaurant is within range of itself.");
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debug();
