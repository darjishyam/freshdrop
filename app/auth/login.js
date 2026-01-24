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
import { useToast } from "../../context/ToastContext";
import { validatePhone } from "../../utils/authUtils";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// Google OAuth Config
const GOOGLE_WEB_CLIENT_ID = "380193662825-vd7d24hn7gq8ioc0udnpb505ouh6un0q.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "380193662825-kj89m0kvlf7999f4s8hqio9trrcsoes5.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "380193662825-kj89m0kvlf7999f4s8hqio9trrcsoes5.apps.googleusercontent.com"; // Using Android ID for iOS

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

  const handleIdentifierChange = (text) => {
    setIdentifier(text);
    if (error) dispatch(clearError());
  };

  // Step 1: Request OTP
  const handleSendOtp = useCallback(async () => {
    try {
      // Pass only identifier (email) to request OTP
      await dispatch(requestOTP({ phone: identifier })).unwrap();

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
      await dispatch(login({ phone: identifier, otp })).unwrap();

      // Success = Redux state updates, usually triggering navigation in _layout or here
      router.replace("/home");
    } catch (err) {
      showToast(err || "Invalid OTP", "error");
    }
  }, [identifier, otp, dispatch, showToast]);

  const navigateToSignup = useCallback(() => {
    router.push("/auth/signup");
  }, []);

  // Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      console.log("Google OAuth Success - Access Token:", authentication.accessToken);
      handleGoogleLogin(authentication.accessToken);
    } else if (response?.type === "error") {
      console.error("Google OAuth Error:", response.error);
      showToast("Google Sign-In Error: " + (response.error?.message || "Authentication failed"), "error");
    }
  }, [response]);

  const handleGoogleLogin = async (token) => {
    try {
      console.log("Calling googleSignIn with token:", token?.substring(0, 20) + "...");
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
        router.replace("/home");
      }
    } catch (err) {
      console.error("Google Sign-In Failed:", err);
      showToast(err || "Google Sign-In failed", "error");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View
          style={Platform.OS === "web" ? styles.webCard : { width: "100%" }}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Login</Text>
            <Text style={styles.headerSubtitle}>
              Enter your email to proceed
            </Text>
          </View>

          <View style={styles.form}>
            {/* STEP 1: CREDENTIALS */}
            {step === 'credentials' && (
              <>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputContainer, { marginBottom: 16 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={identifier}
                    onChangeText={handleIdentifierChange}
                    autoCapitalize="none"
                    autoFocus={Platform.OS === "web"}
                    keyboardType="email-address"
                  />
                </View>

                {/* <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View> */}
              </>
            )}

            {/* STEP 2: OTP */}
            {step === 'otp' && (
              <>
                <Text style={styles.label}>Enter OTP sent to your email</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { letterSpacing: 5, fontSize: 20, textAlign: 'center' }]}
                    placeholder="OTP"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                    maxLength={6}
                    autoFocus
                  />
                </View>

                {/* Resend OTP Button */}
                <View style={styles.resendContainer}>
                  {canResend ? (
                    <Pressable onPress={handleResendOtp}>
                      <Text style={styles.resendTextActive}>Resend OTP</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.resendText}>
                      Resend OTP in <Text style={{ fontWeight: 'bold' }}>{timer}s</Text>
                    </Text>
                  )}
                </View>
              </>
            )}

            {error && (
              <Text style={styles.errorText}>
                {error}
              </Text>
            )}
          </View>

          <LoginButton
            onPress={step === 'credentials' ? handleSendOtp : handleVerifyOtp}
            disabled={isButtonDisabled}
            loading={isLoading}
            text={step === 'credentials' ? "Get OTP" : "Verify OTP"}
          />

          {/* Google Sign-In - Only show on credentials step */}
          {step === 'credentials' && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={styles.googleButton}
                onPress={() => promptAsync()}
                disabled={!request}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              </Pressable>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable onPress={navigateToSignup}>
              <Text style={styles.linkText}> Sign Up</Text>
            </Pressable>
          </View>

          {/* Info box for default credentials */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Demo Credentials</Text>
            <Text style={styles.infoText}>Phone: 9999999999</Text>
            <Text style={styles.infoText}>OTP: 111111</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === "web" ? "#f4f4f6" : "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  webCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    marginBottom: 32,
    width: "100%",
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  countryCode: {
    fontSize: 16,
    color: "#333",
    marginRight: 12,
    fontWeight: "500",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  button: {
    backgroundColor: "#FC8019",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  buttonDisabled: {
    backgroundColor: "#FCA55D",
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  linkText: {
    color: "#FC8019",
    fontSize: 14,
    fontWeight: "bold",
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: "#FFF5E6",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FC8019",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: "#666",
    fontSize: 14,
  },
  resendTextActive: {
    color: "#FC8019",
    fontSize: 14,
    fontWeight: "bold",
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#ddd",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
