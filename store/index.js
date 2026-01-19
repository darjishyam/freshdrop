import { configureStore } from "@reduxjs/toolkit";
import { persistenceMiddleware } from "./middleware/persistenceMiddleware";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import ordersReducer from "./slices/ordersSlice";
import stockReducer from "./slices/stockSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    auth: authReducer,
    orders: ordersReducer,
    stock: stockReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: [
          "user/loadUserData/fulfilled",
          "auth/initialize/fulfilled",
        ],
      },
    }).concat(persistenceMiddleware),
});
