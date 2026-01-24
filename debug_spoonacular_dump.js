const axios = require('axios');
const fs = require('fs');

const SPOONACULAR_API_KEY = '8aff2fd198cf41828d17d461537cb673';
const BASE_URL = 'https://api.spoonacular.com/food/products';

const debugGroceryImages = async (query = 'grocery', number = 10) => {
    try {
        const response = await axios.get(`${BASE_URL}/search`, {
            params: {
                query,
                number,
                apiKey: SPOONACULAR_API_KEY,
            },
        });

        fs.writeFileSync('spoonacular_response.json', JSON.stringify(response.data, null, 2));
        console.log('Response saved to spoonacular_response.json');

    } catch (error) {
        console.error('Error fetching grocery products:', error.response ? error.response.data : error.message);
    }
};

debugGroceryImages();
