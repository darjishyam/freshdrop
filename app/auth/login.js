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

import React, { useState, useCallback, useMemo } from "react";
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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  requestOTP,
  clearError,
  selectIsLoading,
  selectError,
} from "../../store/slices/authSlice";
import { useToast } from "../../context/ToastContext";
import { validatePhone } from "../../utils/authUtils";

// Memoized button component
const LoginButton = React.memo(({ onPress, disabled, loading }) => (
  <Pressable
    style={[styles.button, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.buttonText}>Continue</Text>
    )}
  </Pressable>
));

LoginButton.displayName = "LoginButton";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  // Memoized validation
  const isPhoneValid = useMemo(() => {
    return validatePhone(phoneNumber);
  }, [phoneNumber]);

  // Memoized button disabled state
  const isButtonDisabled = useMemo(() => {
    return !isPhoneValid || isLoading;
  }, [isPhoneValid, isLoading]);

  // Callback for phone number change
  const handlePhoneChange = useCallback(
    (text) => {
      // Only allow numbers
      const cleaned = text.replace(/[^0-9]/g, "");
      setPhoneNumber(cleaned);

      // Clear any previous errors
      if (error) {
        dispatch(clearError());
      }
    },
    [error, dispatch]
  );

  // Callback for login
  const { showToast } = useToast(); // Hook for toast

  const handleLogin = useCallback(async () => {
    if (!isPhoneValid) {
      showToast("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      await dispatch(requestOTP(phoneNumber)).unwrap();
      // Navigate to OTP screen
      router.push({
        pathname: "/auth/otp",
        params: { phone: phoneNumber },
      });
    } catch (err) {
      // Use Toast for better UI feedback
      showToast(err || "User not found. Please sign up.", "error");
    }
  }, [phoneNumber, isPhoneValid, dispatch, showToast]);

  // Callback for navigation to signup
  const navigateToSignup = useCallback(() => {
    router.push("/auth/signup");
  }, []);

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
              Enter your phone number to proceed
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                maxLength={10}
                autoFocus={Platform.OS === "web"}
              />
            </View>
            {phoneNumber.length > 0 && !isPhoneValid && (
              <Text style={styles.errorText}>
                Please enter a valid 10-digit number
              </Text>
            )}
          </View>

          <LoginButton
            onPress={handleLogin}
            disabled={isButtonDisabled}
            loading={isLoading}
          />

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
});
