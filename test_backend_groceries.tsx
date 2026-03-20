const axios = require('axios');

const testBackendGroceries = async () => {
    try {
        // Mumbai Coordinates
        const lat = 19.0760;
        const lon = 72.8777;
        const url = `http://localhost:5000/api/external/groceries?lat=${lat}&lon=${lon}`;

        
        const response = await axios.get(url);

        
        

        if (response.data.length > 0) {
            
        } else {
            
        }

    } catch (error) {
        console.error('Error fetching backend groceries:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
};

testBackendGroceries();
