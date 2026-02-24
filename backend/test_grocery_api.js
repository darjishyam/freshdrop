const axios = require('axios');

async function testFetch() {
    try {
        const response = await axios.get('http://localhost:5000/api/external/groceries?lat=23.5880&lon=72.3693&radius=5000');
        console.log("Status:", response.status);
        console.log("Total items:", response.data.length);
        const local = response.data.filter(i => i.isLocal);
        console.log("Local items found:", local.length);
        local.forEach(l => {
            console.log(`- ${l.name} (${l.id})`);
        });
    } catch (error) {
        console.error("Fetch failed:", error.message);
    }
}

testFetch();
