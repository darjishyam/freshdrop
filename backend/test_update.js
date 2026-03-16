const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpdate() {
    const id = "6996df794870fbcbd833191d"; // Margreta Pizza
    const token = "YOUR_TOKEN_HERE"; // I'll need a token or bypass protection for this test

    const form = new FormData();
    form.append('name', 'Margreta Pizza - TEST');
    // We'll skip the file for now just to see if name updates

    try {
        const response = await axios.put(`https://freshdrop-backend.onrender.com/api/menu/${id}`, form, {
            headers: {
                ...form.getHeaders(),
                // Authorization: `Bearer ${token}`
            }
        });
        console.log('Update success:', response.data);
    } catch (error) {
        console.error('Update failed:', error.response ? error.response.data : error.message);
    }
}
// testUpdate();
