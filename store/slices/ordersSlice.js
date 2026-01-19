import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "user_orders";

const ORDER_STAGES = [
  "Order Placed",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];

const STATUS_INTERVAL = 15000; // 15 seconds * 4 stages = 60 seconds (1 minute) total

export const loadOrders = createAsyncThunk(
  "orders/loadOrders",
  async (_, { rejectWithValue }) => {
    try {
      const storedOrders = await AsyncStorage.getItem(STORAGE_KEY);
      return storedOrders ? JSON.parse(storedOrders) : [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addOrder = createAsyncThunk(
  "orders/addOrder",
  async (order, { getState, rejectWithValue }) => {
    try {
      const { orders } = getState();
      const orderWithTimestamp = {
        ...order,
        date: order.date || new Date().toISOString(),
        status: "Order Placed",
      };

      const newOrders = [orderWithTimestamp, ...orders.items]; // items is the array in state
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
      return orderWithTimestamp;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (orderId, { getState, rejectWithValue }) => {
    try {
      const { orders } = getState();
      const newOrders = orders.items.filter((o) => o.id !== orderId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
      return newOrders;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// We define this to allow manual status updates or internal logic updates
export const updateOrderStatuses = createAsyncThunk(
  "orders/updateStatuses",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { orders } = getState();
      const now = Date.now();
      let hasUpdates = false;

      const updatedOrders = orders.items.map((order) => {
        if (order.status === "Delivered") return order;

        const orderTime = new Date(order.date).getTime();
        const timePassed = now - orderTime;
        const stageIndex = Math.floor(timePassed / STATUS_INTERVAL);
        const newStatus =
          ORDER_STAGES[Math.min(stageIndex, ORDER_STAGES.length - 1)];

        if (newStatus !== order.status) {
          hasUpdates = true;
          return { ...order, status: newStatus };
        }
        return order;
      });

      if (hasUpdates) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
        return updatedOrders;
      }
      return null; // No updates
    } catch (error) {
      return rejectWithValue(error.message);
    }
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
        state.items = action.payload;
      })
      .addCase(loadOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add Order
      .addCase(addOrder.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Cancel Order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      // Update Statuses
      .addCase(updateOrderStatuses.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload;
        }
      });
  },
});

export const selectOrders = (state) => state.orders.items;
export const selectOrdersLoading = (state) => state.orders.isLoading;

export default ordersSlice.reducer;
