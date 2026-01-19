import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY_REVIEWS = "user_reviews";

// Load reviews from persistent storage
export const loadReviews = createAsyncThunk(
  "reviews/loadReviews",
  async (_, { rejectWithValue }) => {
    try {
      const storedReviews = await AsyncStorage.getItem(STORAGE_KEY_REVIEWS);
      return storedReviews ? JSON.parse(storedReviews) : [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add a new review
export const addReview = createAsyncThunk(
  "reviews/addReview",
  async (review, { getState, rejectWithValue }) => {
    try {
      const { reviews } = getState();
      const newReview = {
        ...review,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      const newReviewsList = [newReview, ...reviews.items];
      await AsyncStorage.setItem(
        STORAGE_KEY_REVIEWS,
        JSON.stringify(newReviewsList)
      );
      return newReview;
    } catch (error) {
      return rejectWithValue(error.message);
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
  reducers: {},
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
        state.items.unshift(action.payload);
      });
  },
});

export const selectReviews = (state) => state.reviews.items;

// Selector to get reviews for a specific product
// We match based on product name OR productId
export const selectProductReviews = (state, productNameOrId) => {
  const reviews = state.reviews.items;
  if (!productNameOrId) return [];
  const lowerQuery = productNameOrId.toLowerCase();

  return reviews.filter(
    (r) =>
      (r.productId && r.productId === productNameOrId) ||
      (r.productName && r.productName.toLowerCase() === lowerQuery)
  );
};

export default reviewsSlice.reducer;
