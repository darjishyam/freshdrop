const axios = require("axios");

const testOverpass = async () => {
  console.log("Testing Overpass API (Restaurants)...");
  // const lat = 19.076; // Mumbai
  // const lon = 72.8777;
  // const radius = 1000;
  const lat = 23.2233468; // Mumbai
  const lon = 72.6477057;
  const radius = 10000;
  
  const query = `
    [out:json];
    (
      node["amenity"~"restaurant|cafe|fast_food"](around:${radius},${lat},${lon});
      way["amenity"~"restaurant|cafe|fast_food"](around:${radius},${lat},${lon});
      relation["amenity"~"restaurant|cafe|fast_food"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  try {
    const response = await axios.get(
      "https://overpass-api.de/api/interpreter",
      {
        params: { data: query },
      }
    );

    const elements = response.data.elements;
    console.log(`Success! Found ${elements.length} places.`);
    if (elements.length > 0) {
      console.log("Sample Item:", {
        name: elements[0].tags.name,
        cuisine: elements[0].tags.cuisine,
        lat: elements[0].lat || elements[0].center?.lat,
      });
    }
  } catch (error) {
    console.error("Overpass Failed:", error.message);
  }
};

const testOpenFoodFacts = async () => {
  console.log("\nTesting OpenFoodFacts API (Groceries)...");
  const search = "chocolate";

  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${search}&search_simple=1&action=process&json=1&page=1`
    );

    const products = response.data.products;
    console.log(
      `Success! Found ${products.length} products for query "${search}".`
    );
    if (products.length > 0) {
      console.log("Sample Item:", {
        name: products[0].product_name,
        brand: products[0].brands,
        id: products[0].code,
      });
    }
  } catch (error) {
    console.error("OpenFoodFacts Failed:", error.message);
  }
};

const runTests = async () => {
  await testOverpass();
  await testOpenFoodFacts();
};

runTests();
