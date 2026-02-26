require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Restaurant = require('./models/Restaurant');

    // Reset password to 'pratihar'
    const newHash = await bcrypt.hash('pratihar', 10);

    const r = await Restaurant.findOneAndUpdate(
        { email: '24034211016@gnu.ac.in' },
        { password: newHash },
        { new: true }
    );

    if (r) {
        console.log('Password reset successfully for:', r.email);
        // Verify
        const verify = await bcrypt.compare('pratihar', r.password);
        console.log('Verification (should be true):', verify);
    } else {
        console.log('Restaurant not found');
    }

    mongoose.disconnect();
}).catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
});
