import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchUserOrders, cancelOrderAPI } from "../../services/orderService";

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

export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const updatedOrder = await cancelOrderAPI(orderId);
      return updatedOrder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper to refresh orders (used for polling status updates)
export const updateOrderStatuses = createAsyncThunk(
  "orders/updateStatuses",
  async (_, { dispatch }) => {
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
  reducers: {
    // Plain synchronous action — just inserts the already-created order into Redux state.
    // DO NOT make this an AsyncThunk that calls createNewOrder again!
    addOrder: (state, action) => {
      const newOrder = action.payload;
      // Avoid duplicates (in case it was already added)
      const exists = state.items.some(o => o._id === newOrder._id);
      if (!exists) {
        state.items.unshift(newOrder);
      }
    },
    orderUpdated: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.items.findIndex(o => o._id === updatedOrder._id || o.id === updatedOrder._id);
      if (index !== -1) {
        state.items[index] = updatedOrder;
      } else {
        // If not found (e.g. new order from socket), add to top
        state.items.unshift(updatedOrder);
      }
    }
  },
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
      // Clear orders on logout
      .addCase("auth/logout/fulfilled", (state) => {
        state.items = [];
      })
      // Cancel Order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        const index = state.items.findIndex(o => o._id === updatedOrder._id || o.id === updatedOrder._id);
        if (index !== -1) {
          state.items[index] = updatedOrder;
        }
      });
  },
});

export const { addOrder, orderUpdated } = ordersSlice.actions;
export const selectOrders = (state) => state.orders.items;
export const selectOrdersLoading = (state) => state.orders.isLoading;

export default ordersSlice.reducer;
