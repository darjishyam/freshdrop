/**
 * Authentication Redux Slice
 *
 * Manages authentication state including:
 * - User authentication status
 * - Current user data
 * - Loading states
 * - Error handling
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  initializeDefaultUser,
  logoutUser as logoutUserService,
  registerUser,
  sendOTP,
  updateUserProfile,
  verifyOTP,
} from "../../services/authService";

/**
 * Initialize authentication (load saved user from localStorage)
 * With persistent storage, users stay logged in across app restarts
 */
export const initializeAuth = createAsyncThunk("auth/initialize", async () => {
  await initializeDefaultUser();

  // Load current user from localStorage
  const { getCurrentUser } = require("../../services/authService");
  const currentUser = await getCurrentUser();

  return currentUser; // Returns user if logged in, null if not
});

/**
 * Register a new user
 */
export const signup = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const result = await registerUser(userData);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Send OTP to user's phone
 */
export const requestOTP = createAsyncThunk(
  "auth/requestOTP",
  async (phone, { rejectWithValue }) => {
    try {
      const result = await sendOTP(phone);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Verify OTP and login user
 */
export const login = createAsyncThunk(
  "auth/login",
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const result = await verifyOTP(phone, otp);
      return result.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Logout current user
 */
export const logout = createAsyncThunk("auth/logout", async () => {
  await logoutUserService();
});

/**
 * Update user profile
 */
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ phone, updates }, { rejectWithValue }) => {
    try {
      const result = await updateUserProfile(phone, updates);
      return result.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
  otpSent: false,
};

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearOTPStatus: (state) => {
      state.otpSent = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        // Set user if found in localStorage, otherwise null
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.error.message;
      })

      // Signup
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.isLoading = false;
        state.otpSent = true;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Request OTP
      .addCase(requestOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.otpSent = true;
      })
      .addCase(requestOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.otpSent = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.otpSent = false;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearOTPStatus } = authSlice.actions;
export default authSlice.reducer;

// Selectors (memoized by default with Redux)
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectIsInitialized = (state) => state.auth.isInitialized;
export const selectError = (state) => state.auth.error;
export const selectOTPSent = (state) => state.auth.otpSent;
