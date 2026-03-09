import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../constants/api";

const API_URL = `${API_BASE_URL}/reviews`;

// Load reviews for a specific restaurant
export const loadReviews = createAsyncThunk(
  "reviews/loadReviews",
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${restaurantId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Add a new review
export const addReview = createAsyncThunk(
  "reviews/addReview",
  async (reviewData, { getState, rejectWithValue }) => {
    try {
      const { user } = getState().auth; // Get token from auth state
      const token = user?.token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.post(API_URL, reviewData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const reviewsSlice = createSlice({
  name: "reviews",
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearReviews: (state) => {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(loadReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        // Add new review to the top of the list
        state.items.unshift(action.payload);
      });
  },
});

export const { clearReviews } = reviewsSlice.actions;
export const selectReviews = (state) => state.reviews?.items || [];
export const selectReviewsLoading = (state) => state.reviews?.isLoading || false;
export const selectReviewsError = (state) => state.reviews?.error || null;

// Selector to get reviews for a specific product (client-side filtering)
export const selectProductReviews = (state, { id, name } = {}) => {
  const reviews = state.reviews?.items || [];

  if ((!id && !name) || reviews.length === 0) return [];

  const lowerName = name?.toLowerCase().trim();

  return reviews.filter((r) => {
    // 1. Match by Product ID (ObjectId)
    if (id && r.product && r.product === id) {
      return true;
    }

    // 2. Match by Product Name (for mock items where ID is null)
    // Trim and lowercase both sides for robust matching
    const reviewProductName = r.productName?.toLowerCase().trim();
    if (name && reviewProductName && reviewProductName === lowerName) {
      return true;
    }

    return false;
  });
};

export default reviewsSlice.reducer;
