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
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// Google OAuth Config
const GOOGLE_WEB_CLIENT_ID = "380193662825-vd7d24hn7gq8ioc0udnpb505ouh6un0q.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "380193662825-kj89m0kvlf7999f4s8hqio9trrcsoes5.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "380193662825-kj89m0kvlf7999f4s8hqio9trrcsoes5.apps.googleusercontent.com"; // Using Android ID for iOS

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
      await dispatch(signup({ phone: phoneNumber, name, email })).unwrap();

      // Navigate to OTP screen
      router.push({
        pathname: "/auth/otp",
        params: { phone: phoneNumber, isNewUser: "true" },
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
      handleGoogleSignup(authentication.accessToken);
    } else if (response?.type === "error") {
      console.error("Google OAuth Error:", response.error);
      Alert.alert("Google Sign-In Error", response.error?.message || "Authentication failed");
    }
  }, [response]);

  const handleGoogleSignup = async (token) => {
    try {
      console.log("Calling googleSignIn with token:", token?.substring(0, 20) + "...");
      const result = await dispatch(googleSignIn({ token, action: 'signup' })).unwrap();
      console.log("Google Sign-In Success - User:", result);

      // Reload user data from AsyncStorage (userSlice)
      const { loadUserData } = require("../../store/slices/userSlice");
      await dispatch(loadUserData());

      router.replace("/home");
    } catch (err) {
      console.error("Google Sign-In Failed:", err);
      Alert.alert("Google Sign-In Failed", err || "Please try again");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.webContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Sign Up</Text>
              <Text style={styles.headerSubtitle}>
                Create an account to start ordering
              </Text>
            </View>

            <View style={styles.form}>
              <InputField
                label="Full Name"
                value={name}
                onChangeText={handleNameChange}
                placeholder="Enter your name"
                autoCapitalize="words"
              />
              {name.length > 0 && !validations.isNameValid && (
                <Text style={styles.errorText}>
                  Name must be at least 2 characters
                </Text>
              )}

              <InputField
                label="Email Address"
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {email.length > 0 && !validations.isEmailValid && (
                <Text style={styles.errorText}>Please enter a valid email</Text>
              )}

              <PhoneInput
                value={phoneNumber}
                onChangeText={handlePhoneChange}
              />
              {phoneNumber.length > 0 && !validations.isPhoneValid && (
                <Text style={styles.errorText}>
                  Please enter a valid 10-digit number
                </Text>
              )}
            </View>

            <SignupButton
              onPress={handleSignup}
              disabled={isButtonDisabled}
              loading={isLoading}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <Pressable
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!request}
            >
              <Text style={styles.googleButtonText}>🔍 Continue with Google</Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Pressable onPress={navigateToLogin}>
                <Text style={styles.linkText}> Login</Text>
              </Pressable>
            </View>

            {/* Info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📝 Note</Text>
              <Text style={styles.infoText}>
                All new users will receive OTP: 111111
              </Text>
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
    backgroundColor: Platform.OS === "web" ? "#f4f4f6" : "#fff",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  webContainer: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignSelf: "center",
  },
  header: {
    marginTop: 0,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    fontSize: 16,
    color: "#333",
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  countryCode: {
    fontSize: 16,
    color: "#333",
    marginRight: 12,
    fontWeight: "500",
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  button: {
    backgroundColor: "#FC8019",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
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
    marginTop: -16,
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
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
    borderWidth: 1,
    borderColor: "#ddd",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
});
