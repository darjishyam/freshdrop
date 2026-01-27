import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_BASE_URL } from "../../constants/api";

const API_URL = API_BASE_URL;

// Fetch Restaurants from Overpass API (real nearby places)
export const fetchRestaurants = createAsyncThunk(
  "data/fetchRestaurants",
  async ({ lat, lon }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/external/restaurants?lat=${lat}&lon=${lon}&radius=2000`,
      );
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Fetch Groceries (Stores)
export const fetchGroceries = createAsyncThunk(
  "data/fetchGroceries",
  async ({ lat, lon }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/external/groceries?lat=${lat}&lon=${lon}&radius=5000`,
      );
      if (!response.ok) throw new Error("Failed to fetch groceries");
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  restaurants: [],
  groceries: [],
  isLoading: false,
  error: null,
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Restaurants
    builder.addCase(fetchRestaurants.pending, (state) => {
      if (state.restaurants.length === 0) state.isLoading = true;
    });
    builder.addCase(fetchRestaurants.fulfilled, (state, action) => {
      state.isLoading = false;
      state.restaurants = action.payload;
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
  },
});

export default dataSlice.reducer;
export const selectRestaurants = (state) => state.data.restaurants;
export const selectGroceries = (state) => state.data.groceries;
export const selectDataLoading = (state) => state.data.isLoading;
