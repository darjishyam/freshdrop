import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// Async thunk to load location data from AsyncStorage
// SESSION STORAGE: User data is NOT loaded - users must sign in again
export const loadUserData = createAsyncThunk("user/loadUserData", async () => {
  try {
    const savedLoc = await AsyncStorage.getItem("user_location");
    const savedType = await AsyncStorage.getItem("user_location_type");
    const savedUser = await AsyncStorage.getItem("user_profile");

    return {
      location: savedLoc || "123, React Native Street, Expo City",
      locationType: savedType || "Home",
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
  location: "123, React Native Street, Expo City",
  locationType: "Home",
  isLoading: true,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      try {
        AsyncStorage.setItem("user_profile", JSON.stringify(state.user));
      } catch (e) {
        console.error("Failed to save user profile", e);
      }
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
        state.isLoading = false;
      })
      .addCase(loadUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const { updateUser, updateLocation, updateLocationType } =
  userSlice.actions;
export default userSlice.reducer;

// Selectors
export const selectUser = (state) => state.user.user;
export const selectLocation = (state) => state.user.location;
export const selectLocationType = (state) => state.user.locationType;
export const selectIsLoading = (state) => state.user.isLoading;
