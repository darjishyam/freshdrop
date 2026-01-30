/**
 * Signup Screen Component
 *
 * Handles user registration flow:
 * 1. User enters name, email, and phone number
 * 2. System validates input
 * 3. Creates new user account
 * 4. Sends OTP for verification
 * 5. Navigates to OTP screen
 *
 * Performance optimizations:
 * - Uses useCallback for event handlers
 * - Uses useMemo for validation
 * - Memoized input components
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
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  signup,
  googleSignIn,
  clearError,
  selectIsLoading,
  selectError,
} from "../../store/slices/authSlice";
import {
  validatePhone,
  validateEmail,
  validateName,
} from "../../utils/authUtils";
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
const GOOGLE_WEB_CLIENT_ID = "620352640426-9j8bjtcnqga60snbhqsek4ekgsuf6fjg.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "545670845311-3cpeb3hgqqumb7hmsv88upf2g0kvmotr.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "545670845311-3cpeb3hgqqumb7hmsv88upf2g0kvmotr.apps.googleusercontent.com"; // Using Android ID for iOS

// Configure Native Google Sign-In (Safe to call on web if guarded)
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

// Memoized input field component
const InputField = React.memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    autoCapitalize,
    maxLength,
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </View>
  )
);

InputField.displayName = "InputField";

// Memoized phone input component
const PhoneInput = React.memo(({ value, onChangeText }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Phone Number</Text>
    <View style={styles.phoneContainer}>
      <Text style={styles.countryCode}>+91</Text>
      <TextInput
        style={styles.phoneInput}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        value={value}
        onChangeText={onChangeText}
        maxLength={10}
      />
    </View>
  </View>
));

PhoneInput.displayName = "PhoneInput";

// Memoized signup button
const SignupButton = React.memo(({ onPress, disabled, loading }) => (
  <Pressable
    style={[styles.button, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.buttonText}>Create Account</Text>
    )}
  </Pressable>
));

SignupButton.displayName = "SignupButton";

export default function SignupScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  // Expo Auth Session Hook (For Web)
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  // Handle Expo Auth Session Response (Web)
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      console.log("Web Google Sign-Up Success - Access Token:", authentication.accessToken);
      // For Web, we get Access Token
      handleGoogleSignup(authentication.accessToken, 'web');
    } else if (response?.type === "error") {
      console.error("Web Google Sign-Up Error:", response.error);
      Alert.alert("Google Sign-In Error", response.error?.message || "Authentication failed");
    }
  }, [response]);

  // Memoized validations
  const validations = useMemo(
    () => ({
      isNameValid: validateName(name),
      isEmailValid: validateEmail(email),
      isPhoneValid: validatePhone(phoneNumber),
    }),
    [name, email, phoneNumber]
  );

  // Memoized form validity
  const isFormValid = useMemo(() => {
    return (
      validations.isNameValid &&
      validations.isEmailValid &&
      validations.isPhoneValid
    );
  }, [validations]);

  // Memoized button disabled state
  const isButtonDisabled = useMemo(() => {
    return !isFormValid || isLoading;
  }, [isFormValid, isLoading]);

  // Callbacks for input changes
  const handleNameChange = useCallback(
    (text) => {
      setName(text);
      if (error) dispatch(clearError());
    },
    [error, dispatch]
  );

  const handleEmailChange = useCallback(
    (text) => {
      setEmail(text.toLowerCase());
      if (error) dispatch(clearError());
    },
    [error, dispatch]
  );

  const handlePhoneChange = useCallback(
    (text) => {
      const cleaned = text.replace(/[^0-9]/g, "");
      setPhoneNumber(cleaned);
      if (error) dispatch(clearError());
    },
    [error, dispatch]
  );

  // Callback for signup
  const handleSignup = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert("Invalid Input", "Please fill all fields correctly");
      return;
    }

    try {
      const response = await dispatch(signup({ phone: phoneNumber, name, email })).unwrap();

      console.log("📥 Signup Response Received:", response);

      // Navigate to OTP screen
      router.push({
        pathname: "/auth/otp",
        params: {
          phone: phoneNumber,
          email: email,
          isNewUser: "true",
        },
      });
    } catch (err) {
      Alert.alert(
        "Signup Failed",
        err || "Failed to create account. Please try again."
      );
    }
  }, [phoneNumber, name, email, isFormValid, dispatch]);

  // Callback for navigation to login
  const navigateToLogin = useCallback(() => {
    router.push("/auth/login");
  }, []);

  const handleGoogleSignup = async (token, source) => {
    try {
      console.log(`Calling googleSignIn with token (${source}):`, token?.substring(0, 20) + "...");
      const result = await dispatch(googleSignIn({ token, action: 'signup' })).unwrap();
      console.log("Google Sign-In Success - User:", result);

      // CRITICAL: Always clear location data on Google Sign-In
      // to force new users to select address
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.removeItem("user_location_coords");

      // Check if user has phone number (new user might not)
      if (!result.phone || result.phone === "") {
        console.log("User missing phone, redirecting to add-phone");
        router.replace("/auth/add-phone");
      } else {
        // Just in case, if they have phone but no address
        console.log("User has phone, checking location...");
        router.replace("/profile/addresses");
      }
    } catch (err) {
      console.error("Google Signup Error:", err);
      showToast(err || "Google Signup Failed", "error");
    }
  };

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
      console.log("Native Google Sign-Up Success:", userInfo);

      // Get ID Token
      const { idToken } = userInfo;
      if (idToken) {
        handleGoogleSignup(idToken, 'native');
      } else {
        Alert.alert("Error", "No ID Token received from Google");
      }
    } catch (error) {
      console.error("Native Google Sign-Up Error:", error);
      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services not available");
      } else {
        Alert.alert("Google Signup Error", error.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>
            </View>

            <View style={styles.form}>
              <InputField
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={handleNameChange}
                autoCapitalize="words"
              />

              <InputField
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <PhoneInput
                value={phoneNumber}
                onChangeText={handlePhoneChange}
              />

              <SignupButton
                onPress={handleSignup}
                disabled={isButtonDisabled}
                loading={isLoading}
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
                <Text style={styles.footerText}>Already have an account? </Text>
                <Pressable onPress={navigateToLogin}>
                  <Text style={styles.link}>Sign In</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  countryCode: {
    paddingLeft: 16,
    paddingRight: 8,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
  },
  button: {
    backgroundColor: "#FF5200",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
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
});
