import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// Async thunk to load location data from AsyncStorage
// SESSION STORAGE: User data is NOT loaded - users must sign in again
export const loadUserData = createAsyncThunk("user/loadUserData", async () => {
  try {
    const savedLoc = await AsyncStorage.getItem("user_location");
    const savedType = await AsyncStorage.getItem("user_location_type");
    const savedCoords = await AsyncStorage.getItem("user_location_coords");
    const savedUser = await AsyncStorage.getItem("user_profile");

    return {
      location: savedLoc || "",
      locationType: savedType || "",
      coords: savedCoords ? JSON.parse(savedCoords) : null,
      user: savedUser
        ? JSON.parse(savedUser)
        : { name: "", email: "", phone: "" },
    };
  } catch (error) {
    console.error("Failed to load user data", error);
    throw error;
  }
});

const initialState = {
  user: {
    name: "",
    email: "",
    phone: "",
  },
  location: "",
  locationType: "",
  coords: null,
  isLoading: true,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateUser: (state, action) => {
      console.log("🔄 Updating User Store:", action.payload); // DEBUG LOG
      state.user = { ...state.user, ...action.payload };
      try {
        AsyncStorage.setItem("user_profile", JSON.stringify(state.user));
      } catch (e) {
        console.error("Failed to save user profile", e);
      }
    },
    clearUser: (state) => {
      state.user = { name: "", email: "", phone: "" };
      try {
        AsyncStorage.removeItem("user_profile");
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
        state.isLoading = false;
      })
      .addCase(loadUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
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
export const selectIsLoading = (state) => state.user.isLoading;
