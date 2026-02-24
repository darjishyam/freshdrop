import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_BASE_URL } from "../../constants/api";

const API_URL = API_BASE_URL;

// Fetch Restaurants from Overpass API (real nearby places)
export const fetchRestaurants = createAsyncThunk(
  "data/fetchRestaurants",
  async ({ lat, lon }, { rejectWithValue }) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(
        `${API_URL}/restaurants/nearby?lat=${lat}&lon=${lon}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("Restaurant fetch failed:", response.status);
        throw new Error("Failed to fetch restaurants");
      }

      const data = await response.json();
      console.log("✅ Restaurants fetched:", data.length);
      return data;
    } catch (error) {
      console.error("❌ Restaurant fetch error:", error.message);
      return rejectWithValue(error.message);
    }
  },
);

// Fetch Groceries (Stores)
export const fetchGroceries = createAsyncThunk(
  "data/fetchGroceries",
  async ({ lat, lon }, { rejectWithValue }) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(
        `${API_URL}/external/groceries?lat=${lat}&lon=${lon}&radius=5000`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("Groceries fetch failed:", response.status);
        throw new Error("Failed to fetch groceries");
      }

      const data = await response.json();
      console.log("✅ Groceries fetched:", data.length);
      return data;
    } catch (error) {
      console.error("❌ Groceries fetch error:", error.message);
      return rejectWithValue(error.message);
    }
  },
);

// Fetch Featured Products (Best Food Options)
export const fetchFeaturedProducts = createAsyncThunk(
  "data/fetchFeaturedProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/products/featured`);
      if (!response.ok) throw new Error("Failed to fetch featured products");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Featured products fetch error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  restaurants: [],
  restaurantItems: {},
  groceries: [],
  featuredProducts: [], // NEW
  isLoading: false,
  error: null,
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    // Called by socket listener when restaurant toggles isOpen
    updateRestaurantStatus(state, action) {
      const { restaurantId, isOpen } = action.payload;
      const rest = state.restaurants.find(
        (r) => r._id?.toString() === restaurantId || r.id?.toString() === restaurantId
      );
      if (rest) {
        rest.isOpen = isOpen;
      }
    },
  },
  extraReducers: (builder) => {
    // Restaurants
    builder.addCase(fetchRestaurants.pending, (state) => {
      if (state.restaurants.length === 0) state.isLoading = true;
    });
    builder.addCase(fetchRestaurants.fulfilled, (state, action) => {
      state.isLoading = false;
      // Handle the new payload structure { restaurants: [], restaurantItems: {} }
      if (action.payload.restaurants && action.payload.restaurantItems) {
        state.restaurants = action.payload.restaurants;
        state.restaurantItems = action.payload.restaurantItems;
      } else {
        // Fallback if backend structure differs
        state.restaurants = action.payload;
        state.restaurantItems = {};
      }
    });
    builder.addCase(fetchRestaurants.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Groceries
    builder.addCase(fetchGroceries.pending, (state) => {
      if (state.groceries.length === 0) state.isLoading = true;
    });
    builder.addCase(fetchGroceries.fulfilled, (state, action) => {
      state.isLoading = false;
      state.groceries = action.payload;
    });
    builder.addCase(fetchGroceries.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Featured Products
    builder.addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
      state.featuredProducts = action.payload;
    });
  },
});

export default dataSlice.reducer;
export const { updateRestaurantStatus } = dataSlice.actions;
export const selectRestaurants = (state) => state.data.restaurants;
export const selectRestaurantItems = (state) => state.data.restaurantItems;
export const selectGroceries = (state) => state.data.groceries;
export const selectFeaturedProducts = (state) => state.data.featuredProducts;
export const selectDataLoading = (state) => state.data.isLoading;
