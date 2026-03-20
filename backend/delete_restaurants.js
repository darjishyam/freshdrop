const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

const MONGO_URI = "mongodb+srv://professor:CQ33cuFBo1SoplWf@cluster0.9zk2jrk.mongodb.net/freshdrop?retryWrites=true&w=majority";

const IDS_TO_KEEP = [
    "699697167108542843ddf274", // Heer Resturant
    "6995785a46141973cc864bf9", // Sampati Resturant
    "69899a29e08dc997c2de424f", // McDonald's
    "69899a29e08dc997c2de4250"  // Domino's Pizza
];

mongoose.connect(MONGO_URI)
    .then(async () => {
        
        try {
            const result = await Restaurant.deleteMany({ _id: { $nin: IDS_TO_KEEP } });
            
            
        } catch (e) {
            console.error(e);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error(err));
