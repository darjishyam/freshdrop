import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchUserOrders, createNewOrder } from "../../services/orderService";

// Load orders from Backend
export const loadOrders = createAsyncThunk(
  "orders/loadOrders",
  async (_, { rejectWithValue }) => {
    try {
      const orders = await fetchUserOrders();
      return orders;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add Order to Backend
export const addOrder = createAsyncThunk(
  "orders/addOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      // Backend expects: { restaurantId, items, totalAmount, deliveryAddress, paymentMethod }
      // The frontend 'order' object likely needs mapping to match backend schema if it differs
      // Assuming orderData passed here is formatted correct for API
      const newOrder = await createNewOrder(orderData);
      return newOrder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (orderId, { rejectWithValue }) => {
    // Requires backend endpoint for cancellation (not implemented yet)
    // For now, just simulated error
    return rejectWithValue("Cancellation not implemented in backend yet");
  }
);

// Helper to refresh orders (used for polling status updates)
export const updateOrderStatuses = createAsyncThunk(
  "orders/updateStatuses",
  async (_, { dispatch }) => {
    // Just re-fetch from backend. The backend handles status progression logic.
    dispatch(loadOrders());
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Load Orders
      .addCase(loadOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload; // Replace with fresh list from server
      })
      .addCase(loadOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add Order
      .addCase(addOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.unshift(action.payload); // Add new order to top
      })
      .addCase(addOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Clear orders on logout
      .addCase("auth/logout/fulfilled", (state) => {
        state.items = [];
      });
  },
});

export const selectOrders = (state) => state.orders.items;
export const selectOrdersLoading = (state) => state.orders.isLoading;

export default ordersSlice.reducer;
