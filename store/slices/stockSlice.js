import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  stocks: {}, // Map of itemId -> quantity
};

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    // Deduct stock for a list of items
    deductStock: (state, action) => {
      // action.payload should be an array of { id, quantity } or { id, name, quantity }
      // We will identify items by 'id' primarily, or 'name' if id is missing/generic
      const items = action.payload;
      items.forEach((item) => {
        const id = item.id || item.name;
        // Default to 10 if not tracked yet
        const currentStock =
          state.stocks[id] !== undefined ? state.stocks[id] : 10;
        state.stocks[id] = Math.max(0, currentStock - (item.quantity || 1));
      });
    },
    // Restore stock (e.g. for cancellations)
    restoreStock: (state, action) => {
      const items = action.payload;
      items.forEach((item) => {
        const id = item.id || item.name;
        const currentStock =
          state.stocks[id] !== undefined ? state.stocks[id] : 10;
        state.stocks[id] = currentStock + (item.quantity || 1);
      });
    },
  },
});

export const { deductStock, restoreStock } = stockSlice.actions;

// Selector to get stock for a specific item
export const selectStock = (state, itemId) => {
  const stock = state.stock.stocks[itemId];
  return stock !== undefined ? stock : 10; // Default to 10
};

export default stockSlice.reducer;
