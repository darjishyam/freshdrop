import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { saveAddress } from "../../services/authService";
import apiClient from "../../services/apiClient"; // Need to fetch profile

// Async thunk to load location data from AsyncStorage
// SESSION STORAGE: User data is NOT loaded - users must sign in again
export const loadUserData = createAsyncThunk("user/loadUserData", async () => {
  try {
    const savedLoc = await AsyncStorage.getItem("user_location");
    const savedType = await AsyncStorage.getItem("user_location_type");
    const savedCoords = await AsyncStorage.getItem("user_location_coords");
    const savedUser = await AsyncStorage.getItem("user_profile");
    const addressBook = await AsyncStorage.getItem("user_saved_addresses");

    return {
      location: savedLoc || "",
      locationType: savedType || "",
      coords: savedCoords ? JSON.parse(savedCoords) : null,
      user: savedUser
        ? JSON.parse(savedUser)
        : { name: "", email: "", phone: "" },
      savedAddresses: addressBook ? JSON.parse(addressBook) : [],
    };
  } catch (error) {
    console.error("Failed to load user data", error);
    throw error;
  }
});

// Async thunk to fetch profile and saved addresses directly from backend
export const fetchSavedAddresses = createAsyncThunk(
  "user/fetchSavedAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.request("/auth/profile", { method: "GET" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any).message || "Failed to fetch profile");
      }

      // The profile returns the full user document. We want savedAddresses if exists.
      const addresses = (data as any).savedAddresses || [];
      await AsyncStorage.setItem("user_saved_addresses", JSON.stringify(addresses));
      return addresses;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to save address to backend
export const saveUserAddress = createAsyncThunk(
  "user/saveUserAddress",
  async (addressData, { dispatch, rejectWithValue }) => {
    try {
      // 1. Save to backend (which returns updated savedAddresses array)
      const response = await apiClient.request("/auth/profile/addresses", {
        method: "POST",
        body: JSON.stringify(addressData)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any).message || "Failed to save address");
      }

      const updatedAddresses = data;

      // Save full array to storage
      await AsyncStorage.setItem("user_saved_addresses", JSON.stringify(updatedAddresses));

      // 2. Update local state (Redux + AsyncStorage) for the "active" selected address
      if ((addressData as any).street) dispatch(updateLocation((addressData as any).street));
      if ((addressData as any).type) dispatch(updateLocationType((addressData as any).type));
      if ((addressData as any).coordinates) dispatch(updateLocationCoords((addressData as any).coordinates));

      return updatedAddresses;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to delete address from backend
export const deleteUserAddress = createAsyncThunk(
  "user/deleteUserAddress",
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await apiClient.request(`/auth/profile/addresses/${addressId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any).message || "Failed to delete address");
      }

      const updatedAddresses = data;
      await AsyncStorage.setItem("user_saved_addresses", JSON.stringify(updatedAddresses));
      return updatedAddresses;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: {
    name: "",
    email: "",
    phone: "",
  },
  location: "",
  locationType: "",
  coords: null,
  savedAddresses: [], // New state array
  isLoading: true,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateUser: (state, action) => {
       // DEBUG LOG
      state.user = { ...state.user, ...action.payload };
      try {
        AsyncStorage.setItem("user_profile", JSON.stringify(state.user));
      } catch (e) {
        console.error("Failed to save user profile", e);
      }
    },
    clearUser: (state) => {
      state.user = { name: "", email: "", phone: "" };
      state.savedAddresses = [];
      try {
        AsyncStorage.removeItem("user_profile");
        AsyncStorage.removeItem("user_saved_addresses");
      } catch (e) { }
    },
    updateLocation: (state, action) => {
      state.location = action.payload;
      AsyncStorage.setItem("user_location", action.payload).catch((e) =>
        console.error("Failed to save location", e)
      );
    },
    updateLocationType: (state, action) => {
      state.locationType = action.payload;
      AsyncStorage.setItem("user_location_type", action.payload).catch((e) =>
        console.error("Failed to save location type", e)
      );
    },
    updateLocationCoords: (state, action) => {
      state.coords = action.payload;
      AsyncStorage.setItem(
        "user_location_coords",
        JSON.stringify(action.payload)
      ).catch((e) => console.error("Failed to save location coords", e));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserData.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.location = action.payload.location;
        state.locationType = action.payload.locationType;
        state.coords = action.payload.coords;
        state.savedAddresses = action.payload.savedAddresses;
        state.isLoading = false;
      })
      .addCase(loadUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      .addCase(saveUserAddress.fulfilled, (state, action) => {
        // Update the array with backend response
        state.savedAddresses = action.payload as any[];
      })
      .addCase(fetchSavedAddresses.fulfilled, (state, action) => {
        state.savedAddresses = action.payload as any[];
      })
      .addCase(deleteUserAddress.fulfilled, (state, action) => {
        state.savedAddresses = action.payload as any[];
      });
  },
});

export const { updateUser, clearUser, updateLocation, updateLocationType, updateLocationCoords } =
  userSlice.actions;
export default userSlice.reducer;

// Selectors
export const selectUser = (state) => state.user.user;
export const selectLocation = (state) => state.user.location;
export const selectLocationType = (state) => state.user.locationType;
export const selectLocationCoords = (state) => state.user.coords;
export const selectSavedAddresses = (state) => state.user.savedAddresses;
export const selectIsLoading = (state) => state.user.isLoading;
