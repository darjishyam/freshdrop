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
import { Provider, useSelector } from "react-redux";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { View, Platform } from "react-native";
import { CartFab } from "../components/CartFab";
import { ToastProvider } from "../context/ToastContext";
import { store } from "../store";
import { initializeAuth } from "../store/slices/authSlice";
import { loadUserData } from "../store/slices/userSlice";
import { usePushNotifications } from "@/hooks/usePushNotifications"; // Import hook
import { updatePushToken } from "@/services/authService"; // Import service

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",
};

// Component to handle Push Notifications inside Provider
function AppContent() {
  const { expoPushToken, notification, notificationResponse } = usePushNotifications();
  const { user, token } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (notificationResponse) {
      const data = notificationResponse.notification.request.content.data;
      if (data && data.orderId) {
        console.log("Redirecting to Order Tracking:", data.orderId);
        router.push(`/orders/${data.orderId}`);
      }
    }
  }, [notificationResponse]);

  useEffect(() => {
    if (expoPushToken && token) {
      // Send token to backend
      console.log("Updating Push Token for User App:", expoPushToken);
      updatePushToken(expoPushToken);
    }
  }, [expoPushToken, token]);

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
