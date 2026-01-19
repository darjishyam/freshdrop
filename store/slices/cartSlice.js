import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  pendingItems: [], // Items added before login
  total: 0,
  count: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existing = state.items.find((i) => i.id === item.id);

      if (existing) {
        existing.quantity = Math.min(10, existing.quantity + item.quantity);
      } else {
        item.quantity = Math.min(10, item.quantity);
        state.items.push(item);
      }

      // Recalculate totals
      state.total = state.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
      state.count = state.items.reduce((sum, i) => sum + i.quantity, 0);
    },

    addToPending: (state, action) => {
      const item = action.payload;
      const existing = state.pendingItems.find((i) => i.id === item.id);

      if (existing) {
        existing.quantity = Math.min(10, existing.quantity + item.quantity);
      } else {
        item.quantity = Math.min(10, item.quantity);
        state.pendingItems.push(item);
      }
    },

    syncPendingItems: (state) => {
      // Merge pending items into cart
      state.pendingItems.forEach((pItem) => {
        const existing = state.items.find((i) => i.id === pItem.id);
        if (existing) {
          existing.quantity = Math.min(10, existing.quantity + pItem.quantity);
        } else {
          pItem.quantity = Math.min(10, pItem.quantity);
          state.items.push(pItem);
        }
      });

      // Clear pending items
      state.pendingItems = [];

      // Recalculate totals
      state.total = state.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
      state.count = state.items.reduce((sum, i) => sum + i.quantity, 0);
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);

      // Recalculate totals
      state.total = state.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
      state.count = state.items.reduce((sum, i) => sum + i.quantity, 0);
    },

    updateQuantity: (state, action) => {
      const { itemId, delta } = action.payload;
      const item = state.items.find((i) => i.id === itemId);

      if (item) {
        // Enforce limit of 10 and min of 0
        const newQty = item.quantity + delta;
        item.quantity = Math.min(10, Math.max(0, newQty));
      }

      // Remove items with 0 quantity
      state.items = state.items.filter((i) => i.quantity > 0);

      // Recalculate totals
      state.total = state.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
      state.count = state.items.reduce((sum, i) => sum + i.quantity, 0);
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.count = 0;
    },
  },
});

export const {
  addToCart,
  addToPending,
  syncPendingItems,
  removeFromCart,
  updateQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartCount = (state) => state.cart.count;
export const selectPendingItems = (state) => state.cart.pendingItems;
