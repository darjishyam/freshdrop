const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // The real ID we want to KEEP
        const REAL_ID = '6995785a46141973cc864bf9';

        console.log(`Keeping Real Restaurant: ${REAL_ID}`);

        // Find duplicates (same name/email but NOT the real ID)
        const duplicates = await Restaurant.find({
            _id: { $ne: REAL_ID },
            $or: [
                { name: { $regex: /sampat/i } },
                { email: { $regex: /sampat/i } }
            ]
        });

        console.log(`Found ${duplicates.length} duplicates to delete.`);

        for (const dup of duplicates) {
            console.log(`Deleting: ${dup.name} (ID: ${dup._id})`);
            await Restaurant.findByIdAndDelete(dup._id);
        }

        console.log("Cleanup Complete!");
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

cleanup();
