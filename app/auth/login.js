/**
 * Login Screen Component
 *
 * Handles user login flow:
 * 1. User enters phone number
 * 2. System checks if user exists
 * 3. Sends OTP to user
 * 4. Navigates to OTP verification screen
 *
 * Performance optimizations:
 * - Uses useCallback for event handlers
 * - Uses useMemo for computed values
 * - Memoized child components
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  requestOTP,
  login,
  googleSignIn,
  clearError,
  selectIsLoading,
  selectError,
} from "../../store/slices/authSlice";
import { updateUser } from "../../store/slices/userSlice";
import { useToast } from "../../context/ToastContext";
import { validatePhone } from "../../utils/authUtils";
import Constants from "expo-constants";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

// Conditionally require Native Google Sign-In to prevent Expo Go crash
let GoogleSignin, statusCodes;
try {
  const GoogleSigninPackage = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleSigninPackage.GoogleSignin;
  statusCodes = GoogleSigninPackage.statusCodes;
} catch (e) {
  console.log("Native Google Sign-In not available (likely running in Expo Go)");
}

WebBrowser.maybeCompleteAuthSession();

// Configure Google Sign-In
// Web Client ID is required for getting the ID Token.
// Android Client ID is handled automatically by google-services.json
const GOOGLE_WEB_CLIENT_ID = "620352640426-9j8bjtcnqga60snbhqsek4ekgsuf6fjg.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "545670845311-3cpeb3hgqqumb7hmsv88upf2g0kvmotr.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "545670845311-3cpeb3hgqqumb7hmsv88upf2g0kvmotr.apps.googleusercontent.com"; // Using Android ID for iOS

// Configure Native Google Sign-In (Safe to call on web if guarded, but better to check platform)
if (Platform.OS !== 'web' && GoogleSignin) {
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
  } catch (err) {
    console.warn("GoogleSignin configure failed", err);
  }
}

// Memoized button component
const LoginButton = React.memo(({ onPress, disabled, loading, text }) => (
  <Pressable
    style={[styles.button, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.buttonText}>{text || "Continue"}</Text>
    )}
  </Pressable>
));

LoginButton.displayName = "LoginButton";

export default function LoginScreen() {
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");

  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const { showToast } = useToast();

  // Expo Auth Session Hook (For Web)
  // We initialize it always, but only use it on Web
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  const isButtonDisabled = useMemo(() => {
    if (isLoading) return true;
    if (step === 'credentials') return !identifier; // Removed password check
    if (step === 'otp') return otp.length < 6;
    return false;
  }, [step, identifier, otp, isLoading]);

  // Timer for Resend OTP
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Handle Expo Auth Session Response (Web)
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      console.log("Web Google OAuth Success - Access Token:", authentication.accessToken);
      // For Web, we get Access Token, backend verifies via UserInfo endpoint
      handleGoogleLogin(authentication.accessToken, 'web');
    } else if (response?.type === "error") {
      console.error("Web Google OAuth Error:", response.error);
      showToast("Google Sign-In Error: " + (response.error?.message || "Authentication failed"), "error");
    }
  }, [response]);

  const handleIdentifierChange = (text) => {
    setIdentifier(text);
    if (error) dispatch(clearError());
  };

  // Step 1: Request OTP
  const handleSendOtp = useCallback(async () => {
    try {
      // Pass only identifier (email) to request OTP
      const response = await dispatch(requestOTP({ phone: identifier })).unwrap();

      setStep('otp');
      setTimer(30);
      setCanResend(false);
      showToast("OTP sent to your email!");
    } catch (err) {
      showToast(err || "Failed to send OTP", "error");
    }
  }, [identifier, dispatch, showToast]);

  // Resend OTP Handler
  const handleResendOtp = useCallback(async () => {
    if (!canResend) return;

    try {
      // Pass only phone/email to trigger "Resend" logic (no password check)
      await dispatch(requestOTP({ phone: identifier })).unwrap();

      setTimer(30);
      setCanResend(false);
      showToast("OTP resent successfully!");
    } catch (err) {
      showToast(err || "Failed to resend OTP", "error");
    }
  }, [canResend, identifier, dispatch, showToast]);

  // Step 2: Verify OTP
  const handleVerifyOtp = useCallback(async () => {
    try {
      // Use login action (which maps to authService.verifyOTP)
      const result = await dispatch(login({ phone: identifier, otp })).unwrap();

      // Update user slice immediately
      dispatch(updateUser(result));

      // Success = Redux state updates, usually triggering navigation in _layout or here
      router.replace("/home");
    } catch (err) {
      showToast(err || "Invalid OTP", "error");
    }
  }, [identifier, otp, dispatch, showToast]);

  const navigateToSignup = useCallback(() => {
    router.push("/auth/signup");
  }, []);

  // HYBRID GOOGLE LOGIN HANDLER
  const onGoogleButtonPress = async () => {
    if (Platform.OS === 'web') {
      // WEB FLOW: expo-auth-session
      promptAsync();
    } else {
      // NATIVE FLOW (Android/iOS): react-native-google-signin
      if (GoogleSignin) {
        handleNativeGoogleSignIn();
      } else {
        Alert.alert("Not Supported", "Native Google Sign-In is not supported in this environment (likely Expo Go). Please build the APK.");
      }
    }
  };

  const handleNativeGoogleSignIn = async () => {
    try {
      if (!GoogleSignin) return;
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("Native Google Sign-In Success:", userInfo);

      // Get ID Token
      const { idToken } = userInfo;
      if (idToken) {
        // Native returns ID Token
        handleGoogleLogin(idToken, 'native');
      } else {
        Alert.alert("Error", "No ID Token received from Google");
      }
    } catch (error) {
      console.error("Native Google Sign-In Error:", error);
      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services not available");
      } else {
        Alert.alert("Google Login Error", error.message);
      }
    }
  };

  const handleGoogleLogin = async (token, source) => {
    try {
      console.log(`Calling googleSignIn with token (${source}):`, token?.substring(0, 20) + "...");
      // Backend should handle both Access Token (Web) and ID Token (Native)
      // Or we standardize interaction. Usually, ID Token is preferred for Native.
      const result = await dispatch(googleSignIn({ token, action: 'login' })).unwrap();
      console.log("Google Sign-In Success - User:", result);

      // Reload user data from AsyncStorage (userSlice)
      const { loadUserData } = require("../../store/slices/userSlice");
      const userData = await dispatch(loadUserData()).unwrap();

      // Check if user has phone number
      if (!result.phone || result.phone === "") {
        console.log("User missing phone, redirecting to add-phone");
        router.replace("/auth/add-phone");
        return;
      }

      // Check if user has location set
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const savedCoords = await AsyncStorage.getItem("user_location_coords");

      if (!savedCoords || savedCoords === "null") {
        console.log("User missing location, redirecting to addresses");
        router.replace("/profile/addresses");
      } else {
        // Everything set, go home
        router.replace("/home");
      }

    } catch (err) {
      console.error("Google Login Error:", err);
      showToast(err || "Google Login Failed", "error");
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {step === 'credentials' ? (
            // Check identifier (is it email or phone?) to show correct label/keyboard
            // Assuming simplified: just one input field for identifier
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number or Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone or email"
                  value={identifier}
                  onChangeText={handleIdentifierChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <LoginButton
                onPress={handleSendOtp}
                disabled={isButtonDisabled}
                loading={isLoading}
                text="Get OTP"
              />

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.line} />
              </View>

              {/* Google Sign In Button */}
              <Pressable style={styles.googleButton} onPress={onGoogleButtonPress}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Pressable onPress={navigateToSignup}>
                  <Text style={styles.link}>Sign Up</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Enter OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <View style={styles.resendContainer}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>Resend in {timer}s</Text>
                ) : (
                  <Pressable onPress={handleResendOtp}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </Pressable>
                )}
              </View>

              <LoginButton
                onPress={handleVerifyOtp}
                disabled={isButtonDisabled}
                loading={isLoading}
                text="Verify OTP"
              />

              <Pressable
                style={styles.backButton}
                onPress={() => {
                  setStep('credentials');
                  setOtp("");
                  setTimer(30);
                }}
              >
                <Text style={styles.backButtonText}>Back to Phone/Email</Text>
              </Pressable>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#FF5200", // Swiggy Orange
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  link: {
    color: "#FF5200",
    fontSize: 14,
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  timerText: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    color: '#FF5200',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  }
});
