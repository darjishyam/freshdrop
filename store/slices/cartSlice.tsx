import { createSlice, createSelector } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  pendingItems: [],
  total: 0,
  count: 0,
  restaurantId: null,
  restaurantName: null,
  discountPercent: 0,
  maxDiscount: 0,
  minOrderValue: 0,
  appliedCoupon: null, // { code, discountAmount }
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;

      // If cart is empty, set the restaurant info
      if (state.items.length === 0) {
        state.restaurantId = item.restaurantId;
        state.restaurantName = item.restaurantName;
        state.discountPercent = item.discountPercent || 0;
        state.maxDiscount = item.maxDiscount || 0;
        state.minOrderValue = item.minOrderValue || 0;
      } else if (state.restaurantId === item.restaurantId) {
        // Update discount fields in case they changed since last time
        if (item.discountPercent !== undefined) state.discountPercent = item.discountPercent;
        if (item.maxDiscount !== undefined) state.maxDiscount = item.maxDiscount;
        if (item.minOrderValue !== undefined) state.minOrderValue = item.minOrderValue;
      }

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

      // If cart becomes empty, reset restaurant info
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }

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
      state.restaurantId = null;
      state.restaurantName = null;
      state.discountPercent = 0;
      state.maxDiscount = 0;
      state.minOrderValue = 0;
      state.appliedCoupon = null;
    },

    setAppliedCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
    },

    removeAppliedCoupon: (state) => {
      state.appliedCoupon = null;
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
  setAppliedCoupon,
  removeAppliedCoupon,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectAppliedCoupon = (state) => state.cart.appliedCoupon;
export const selectCartCount = (state) => (state.cart.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
export const selectPendingItems = (state) => state.cart.pendingItems;
export const selectCartRestaurant = createSelector(
  [(state) => state.cart.restaurantId, (state) => state.cart.restaurantName],
  (id, name) => ({ id, name })
);
