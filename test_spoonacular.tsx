const axios = require('axios');

const SPOONACULAR_API_KEY = '8aff2fd198cf41828d17d461537cb673';
const BASE_URL = 'https://api.spoonacular.com/food/products';

const searchGroceryProducts = async (query = 'grocery', number = 10) => {
    try {
        const response = await axios.get(`${BASE_URL}/search`, {
            params: {
                query,
                number,
                apiKey: SPOONACULAR_API_KEY,
            },
        });
        
        
        if (response.data.products.length > 0) {
            
        }
    } catch (error) {
        console.error('Error fetching grocery products:', error.response ? error.response.data : error.message);
    }
};

searchGroceryProducts();
