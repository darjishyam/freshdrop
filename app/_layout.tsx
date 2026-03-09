import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { Provider, useSelector, useDispatch } from "react-redux";
import { Alert } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { View } from "react-native";
import { CartFab } from "../components/CartFab";
import { ToastProvider } from "../context/ToastContext";
import { store } from "../store";
import { initializeAuth, logout } from "../store/slices/authSlice";
import { loadUserData } from "../store/slices/userSlice";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { updatePushToken } from "@/services/authService";
import socketService from "../services/socketService";
import { setSuspensionHandler } from "../services/apiClient";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",
};

// Component to handle Push Notifications inside Provider
function AppContent() {
  const { expoPushToken, notification, notificationResponse } = usePushNotifications();
  const { user } = useSelector((state) => state.auth);
  const token = user?.token;
  const router = useRouter();
  const dispatch = useDispatch();

  // Handle notification tap redirect
  useEffect(() => {
    if (notificationResponse) {
      const data = notificationResponse.notification.request.content.data;
      if (data && data.orderId) {
        console.log("Redirecting to Order Tracking:", data.orderId);
        router.push(`/orders/${data.orderId}`);
      }
    }
  }, [notificationResponse]);

  // Handle global API suspension errors
  useEffect(() => {
    setSuspensionHandler((message) => {
      console.log("[apiClient] Intercepted suspension:", message);
      Alert.alert(
        "Account Suspended",
        message || "Your account has been suspended. Please contact support.",
        [{
          text: "OK",
          onPress: () => router.replace("/auth"),
        }]
      );
      dispatch(logout());
    });
  }, []);

  // Join user socket room and listen for suspension kick
  useEffect(() => {
    if (user?._id) {
      // Step 1: Connect socket
      socketService.connect();

      // Step 2: Queue user room join (works even if not yet connected)
      socketService.joinUserRoom(user._id);

      // Step 3: Listen for account suspension ("sessionKicked" from server)
      const handleKick = (data) => {
        console.log("[Socket] Session kicked:", data?.message);
        Alert.alert(
          "Account Suspended",
          data?.message || "Your account has been suspended. Please contact support.",
          [{
            text: "OK",
            onPress: () => router.replace("/auth"),
          }]
        );
        // Immediately dispatch logout to clear Redux state + AsyncStorage
        dispatch(logout());
      };

      socketService.on("sessionKicked", handleKick);

      // Cleanup listener when user logs out or changes
      return () => {
        socketService.off("sessionKicked", handleKick);
      };
    }
  }, [user?._id]);

  useEffect(() => {
    if (expoPushToken && token) {
      // Send token to backend
      console.log("Updating Push Token for User App:", expoPushToken);
      updatePushToken(expoPushToken);
    }
  }, [expoPushToken, token, user]);

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen
          name="restaurant/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="collection/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="cart/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profile/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="orders" options={{ headerShown: false }} />
      </Stack>
      <CartFab />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      // Initialize authentication and load user data when app starts
      store.dispatch(initializeAuth());
      store.dispatch(loadUserData());
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Provider>
  );
}
