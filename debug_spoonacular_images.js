const axios = require('axios');

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

        console.log(`Fetched ${response.data.products.length} products.`);
        response.data.products.forEach((p, i) => {
            console.log(`[${i}] ID: ${p.id} | Title: ${p.title}`);
            console.log(`    Image: ${p.image}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error fetching grocery products:', error.response ? error.response.data : error.message);
    }
};

debugGroceryImages();
