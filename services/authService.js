/**
 * Authentication Service
 *
 * This service handles all authentication-related operations including:
 * - User registration (signup)
 * - User login
 * - OTP verification
 * - Local storage management for user credentials
 *
 * Default credentials stored:
 * - Phone: 9999999999
 * - OTP: 111111
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const STORAGE_KEYS = {
  USERS: "auth_users",
  CURRENT_USER: "auth_current_user",
  DEFAULT_INITIALIZED: "auth_default_initialized",
};

// Default user credentials
const DEFAULT_USER = {
  phone: "9999999999",
  otp: "111111",
  name: "Default User",
  email: "default@example.com",
};

/**
 * Initialize default user in storage if not already present
 */
export const initializeDefaultUser = async () => {
  try {
    const initialized = await AsyncStorage.getItem(
      STORAGE_KEYS.DEFAULT_INITIALIZED
    );

    if (!initialized) {
      const users = {};
      users[DEFAULT_USER.phone] = {
        phone: DEFAULT_USER.phone,
        name: DEFAULT_USER.name,
        email: DEFAULT_USER.email,
        otp: DEFAULT_USER.otp,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_INITIALIZED, "true");
      console.log("Default user initialized");
    }
  } catch (error) {
    console.error("Error initializing default user:", error);
    throw error;
  }
};

/**
 * Get all registered users from storage
 */
export const getAllUsers = async () => {
  try {
    const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    return usersJson ? JSON.parse(usersJson) : {};
  } catch (error) {
    console.error("Error getting users:", error);
    return {};
  }
};

/**
 * Check if a user exists by phone number
 */
export const checkUserExists = async (phone) => {
  try {
    const users = await getAllUsers();
    return !!users[phone];
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
};

/**
 * Register a new user
 */
export const registerUser = async (userData) => {
  try {
    const { phone, name, email } = userData;

    // Check if user already exists
    const userExists = await checkUserExists(phone);
    if (userExists) {
      throw new Error("User with this phone number already exists");
    }

    // Generate OTP (in production, this would be sent via SMS)
    const otp = "111111"; // Default OTP for all users

    // Get existing users
    const users = await getAllUsers();

    // Add new user
    users[phone] = {
      phone,
      name,
      email,
      otp,
      createdAt: new Date().toISOString(),
    };

    // Save to storage
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    return {
      success: true,
      message: "User registered successfully",
      otp, // In production, don't return OTP
    };
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

/**
 * Send OTP to user (simulated)
 */
export const sendOTP = async (phone) => {
  try {
    const users = await getAllUsers();
    const user = users[phone];

    if (!user) {
      throw new Error("User not found. Please sign up first.");
    }

    // In production, send OTP via SMS service
    // For now, we just return success
    return {
      success: true,
      message: "OTP sent successfully",
      otp: user.otp, // In production, don't return OTP
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (phone, otp) => {
  try {
    const users = await getAllUsers();
    const user = users[phone];

    if (!user) {
      throw new Error("User not found");
    }

    if (user.otp !== otp) {
      throw new Error("Invalid OTP");
    }

    // PERSISTENT STORAGE: Save current user to AsyncStorage
    // User will stay logged in even after app restart
    const currentUser = {
      phone: user.phone,
      name: user.name,
      email: user.email,
    };

    await AsyncStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(currentUser)
    );

    return {
      success: true,
      user: currentUser,
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

/**
 * Get current logged-in user
 * PERSISTENT STORAGE: Load user from AsyncStorage
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
 * PERSISTENT STORAGE: Remove current user from AsyncStorage
 */
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return { success: true };
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (phone, updates) => {
  try {
    const users = await getAllUsers();
    const user = users[phone];

    if (!user) {
      throw new Error("User not found");
    }

    // Update user data
    users[phone] = {
      ...user,
      ...updates,
      phone, // Ensure phone doesn't change
      updatedAt: new Date().toISOString(),
    };

    // Save to storage
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // SESSION STORAGE: Don't persist current user session
    // Just return the updated user data

    return {
      success: true,
      user: users[phone],
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};
