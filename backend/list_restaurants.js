const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const fs = require('fs');

const MONGO_URI = "mongodb+srv://professor:CQ33cuFBo1SoplWf@cluster0.9zk2jrk.mongodb.net/freshdrop?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(async () => {
        
        try {
            const all = await Restaurant.find({}, 'name externalId status storeType');
            let output = "ID | Name | ExternalID | Status | StoreType\n";
            all.forEach(r => {
                output += `${r._id} | ${r.name} | ${r.externalId} | ${r.status} | ${r.storeType}\n`;
            });
            fs.writeFileSync('restaurants_list.txt', output);
            
        } catch (e) {
            console.error(e);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error(err));
