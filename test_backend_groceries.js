const axios = require('axios');

const testBackendGroceries = async () => {
    try {
        // Mumbai Coordinates
        const lat = 19.0760;
        const lon = 72.8777;
        const url = `http://localhost:5000/api/external/groceries?lat=${lat}&lon=${lon}`;

        console.log(`Testing URL: ${url}`);
        const response = await axios.get(url);

        console.log('Status:', response.status);
        console.log('Data count:', response.data.length);

        if (response.data.length > 0) {
            console.log('Sample Store:', JSON.stringify(response.data[0], null, 2));
        } else {
            console.log('No stores found or empty response.');
        }

    } catch (error) {
        console.error('Error fetching backend groceries:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
};

testBackendGroceries();
