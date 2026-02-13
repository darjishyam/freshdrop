/**
 * Authentication Service
 * 
 * Handles API calls to the real backend server.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/api";

const API_URL = API_BASE_URL;

const STORAGE_KEYS = {
  CURRENT_USER: "auth_current_user",
  TOKEN: "auth_token",
};

/**
 * Register a new user
 * POST /api/auth/signup
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    return {
      success: true,
      message: data.message,
      // In a real app, we don't return OTP here unless for dev testing
      // The backend returns { message, email, phone, devOtp: '...' }
      devOtp: data.devOtp
    };
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

/**
 * Send OTP to user (Login)
 * POST /api/auth/otp/send
 */
export const sendOTP = async (phone) => {
  try {
    // Determine login type based on input (phone or email)
    // The backend's sendOtp endpoint expects { email, phone, type: 'login' }
    // We send 'phone' if it looks like a phone number, else 'email'
    // But existing frontend passes just 'phone' which might be the number

    const isEmail = phone.includes('@');
    const payload = {
      type: 'login',
      [isEmail ? 'email' : 'phone']: phone
    };

    const response = await fetch(`${API_URL}/auth/otp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific "User not found" messages if needed
      throw new Error(data.message || "Failed to send OTP");
    }

    return {
      success: true,
      message: data.message,
      otp: data.devOtp
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

/**
 * Verify OTP
 * POST /api/auth/otp/verify
 */
export const verifyOTP = async (phone, otp) => {
  try {
    // Backend expects { email, otp, phone }
    const isEmail = phone.includes('@');
    const payload = {
      otp,
      [isEmail ? 'email' : 'phone']: phone
    };

    const response = await fetch(`${API_URL}/auth/otp/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Invalid OTP");
    }

    // Backend returns: { _id, name, email, phone, token, message, isNewUser }

    const user = {
      _id: data._id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      token: data.token,
      address: data.address, // Include address
      isNewUser: data.isNewUser
    };

    // Save session
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

/**
 * Get current logged-in user
 */
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem("user_profile"); // Fix: Clear user slice persistence
    return { success: true };
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

/**
 * Update user profile
 * Uses PUT /api/auth/profile with Bearer token
 */
export const updateUserProfile = async (phone, updates) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    const currentUser = await getCurrentUser();

    // We need the user's ID for the updateProfile endpoint as per backend controller
    // "const { _id, name, email, phone, image } = req.body;"

    if (!currentUser || !currentUser._id) {
      throw new Error("User not found in session");
    }

    const payload = {
      _id: currentUser._id,
      ...updates
    };

    const response = await fetch(`${API_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Update failed");
    }

    // Update local storage
    const updatedUser = {
      _id: data._id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      image: data.image,
      token: data.token
    };

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));

    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Google Authentication
 * POST /api/auth/google
 */
export const googleAuth = async (token, action = 'signup') => {
  try {
    console.log(`[authService] Calling /auth/google with action: ${action}`);
    const response = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, action }),
    });

    const data = await response.json();
    console.log("[authService] Backend response:", data);

    if (!response.ok) {
      console.error("[authService] Backend Error Details:", JSON.stringify(data, null, 2));
      throw new Error(data.message || "Google authentication failed");
    }

    // Backend returns: { _id, name, email, phone, image, token, isNewUser }
    const user = {
      _id: data._id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      image: data.image,
      token: data.token
    };

    // Save session to BOTH auth and user_profile keys
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);

    // CRITICAL: Also save to user_profile for userSlice compatibility
    await AsyncStorage.setItem("user_profile", JSON.stringify({
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      image: data.image
    }));

    console.log("[authService] User saved to AsyncStorage (both keys):", user.email);

    return {
      success: true,
      user: user,
      isNewUser: data.isNewUser
    };
  } catch (error) {
    console.error("[authService] Error with Google authentication:", error);
    throw error;
  }
};

/**
 * Update Push Token
 * PUT /api/auth/push-token
 */
export const updatePushToken = async (pushToken) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return;

    const response = await fetch(`${API_URL}/auth/push-token`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ pushToken })
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn("Failed to update push token", data.message);
    }
    return data;
  } catch (error) {
    console.error("Error updating push token:", error);
  }
};

// Default user init is not needed for real backend, but kept empty for safety imports
export const initializeDefaultUser = async () => {
  return;
};
