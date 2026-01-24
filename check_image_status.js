const axios = require('axios');

const imageUrls = [
    "https://img.spoonacular.com/products/4330156-312x231.jpg",
    "https://img.spoonacular.com/products/6298276-312x231.jpg",
    "https://img.spoonacular.com/products/5863722-312x231.jpg",
    "https://img.spoonacular.com/products/4107468-312x231.jpg",
    "https://img.spoonacular.com/products/5267972-312x231.jpeg",
    "https://img.spoonacular.com/products/723581-312x231.jpeg"
];

const checkImages = async () => {
    for (const url of imageUrls) {
        try {
            const response = await axios.head(url);
            console.log(`URL: ${url} - Status: ${response.status}`);
        } catch (error) {
            console.log(`URL: ${url} - Error: ${error.response ? error.response.status : error.message}`);
        }
    }
};

checkImages();
