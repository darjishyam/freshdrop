/**
 * OTP Verification Screen Component
 *
 * Handles OTP verification flow:
 * 1. User enters 6-digit OTP
 * 2. System verifies OTP
 * 3. On success, logs in user and navigates to home
 *
 * Performance optimizations:
 * - Uses useCallback for event handlers
 * - Uses useMemo for computed values
 * - Memoized OTP input component
 */

import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  clearError,
  login,
  selectError,
  selectIsLoading,
} from "../../store/slices/authSlice";
import { updateUser } from "../../store/slices/userSlice";
import { useToast } from "../../context/ToastContext";
import { validateOTP } from "../../utils/authUtils";

// Memoized OTP input component
const OTPInput = React.memo(({ value, onChange, inputRefs }) => {
  const handleChange = useCallback(
    (text, index) => {
      // Only allow numbers
      const cleaned = text.replace(/[^0-9]/g, "");

      if (cleaned.length > 0) {
        const newOTP = value.split("");
        newOTP[index] = cleaned[cleaned.length - 1];
        onChange(newOTP.join(""));

        // Move to next input
        if (index < 5 && inputRefs.current[index + 1]) {
          inputRefs.current[index + 1].focus();
        }
      } else {
        const newOTP = value.split("");
        newOTP[index] = "";
        onChange(newOTP.join(""));
      }
    },
    [value, onChange, inputRefs]
  );

  const handleKeyPress = useCallback(
    (e, index) => {
      if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [value, inputRefs]
  );

  return (
    <View style={styles.otpContainer}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[styles.otpInput, value[index] && styles.otpInputFilled]}
          value={value[index] || ""}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          autoFocus={index === 0}
        />
      ))}
    </View>
  );
});

OTPInput.displayName = "OTPInput";

// Memoized verify button
const VerifyButton = React.memo(({ onPress, disabled, loading }) => (
  <Pressable
    style={[styles.button, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.buttonText}>Verify OTP</Text>
    )}
  </Pressable>
));

VerifyButton.displayName = "VerifyButton";

export default function OTPScreen() {
  const { phone, email, isNewUser, devOtp } = useLocalSearchParams();
  const [otp, setOTP] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  // ... (rest of component internal state)

  // Debug: Log route params
  useEffect(() => {
    console.log("🔍 OTP Screen Params:", { phone, email, isNewUser, devOtp });
  }, [phone, email, isNewUser, devOtp]);

  // ... (keeping existing hooks and callbacks)

  // (We need to jump to the JSX part)

  /* NOTE: The replace_file_content tool needs specific target content. 
     I will target the specific blocks. */



  const inputRefs = useRef([]);

  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  // Initialize timer - Always start fresh 30-second countdown when page opens
  useEffect(() => {
    const initializeTimer = async () => {
      try {
        // Always start new 30-second timer when OTP page opens
        const now = Date.now();
        const endTime = now + 30000; // 30 seconds from now

        if (Platform.OS === "web") {
          localStorage.setItem("otpTimerEndTime", endTime.toString());
        } else {
          const AsyncStorage =
            require("@react-native-async-storage/async-storage").default;
          await AsyncStorage.setItem("otpTimerEndTime", endTime.toString());
        }

        setResendTimer(30);
      } catch (error) {
        console.error("Error initializing timer:", error);
        setResendTimer(30);
      }
    };

    initializeTimer();

    // Auto-focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          const newValue = prev - 1;
          // Clear localStorage when timer reaches 0
          if (newValue === 0) {
            if (Platform.OS === "web") {
              localStorage.removeItem("otpTimerEndTime");
            } else {
              const AsyncStorage =
                require("@react-native-async-storage/async-storage").default;
              AsyncStorage.removeItem("otpTimerEndTime");
            }
          }
          return newValue;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Memoized OTP validation
  const isOTPValid = useMemo(() => {
    return validateOTP(otp);
  }, [otp]);

  // Memoized button disabled state
  const isButtonDisabled = useMemo(() => {
    return !isOTPValid || isLoading;
  }, [isOTPValid, isLoading]);

  // Memoized masked phone number
  const maskedPhone = useMemo(() => {
    if (!phone || phone.length !== 10) return phone;
    return `******${phone.slice(-4)}`;
  }, [phone]);

  // Memoized resend button state
  const canResend = useMemo(() => {
    return resendTimer === 0;
  }, [resendTimer]);

  // Callback for OTP change
  const handleOTPChange = useCallback(
    (newOTP) => {
      setOTP(newOTP);
      if (error) {
        dispatch(clearError());
      }
    },
    [error, dispatch]
  );

  // Callback for verification
  const { showToast } = useToast();

  const handleVerify = useCallback(async () => {
    if (!isOTPValid) {
      showToast("Please enter a valid 6-digit OTP", "error");
      return;
    }

    try {
      const result = await dispatch(login({ phone, otp })).unwrap();

      console.log("✅ Login Result Payload:", JSON.stringify(result, null, 2)); // DEBUG LOG

      // Update user slice with auth data (for backward compatibility)
      dispatch(
        updateUser({
          name: result.name,
          email: result.email,
          phone: result.phone,
        })
      );

      // Clear OTP timer from storage
      if (Platform.OS === "web") {
        localStorage.removeItem("otpTimerEndTime");
      } else {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;
        await AsyncStorage.removeItem("otpTimerEndTime");
      }

      showToast("Verification Successful!", "success");
      // Navigate to home
      router.replace("/(tabs)/home");
    } catch (err) {
      showToast(err || "Invalid OTP. Please try again.", "error");

      setOTP("");
      inputRefs.current[0]?.focus();
    }
  }, [phone, otp, isOTPValid, dispatch, showToast]);

  // Callback for resend OTP
  const handleResendOTP = useCallback(async () => {
    if (resendTimer > 0) return;

    Alert.alert("OTP Sent", "A new OTP has been sent to your phone");
    setOTP("");

    // Set new 30-second timer
    const now = Date.now();
    const endTime = now + 30000; // 30 seconds from now

    if (Platform.OS === "web") {
      localStorage.setItem("otpTimerEndTime", endTime.toString());
    } else {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem("otpTimerEndTime", endTime.toString());
    }

    setResendTimer(30);
    inputRefs.current[0]?.focus();
  }, [resendTimer]);

  // Callback for back navigation
  const handleBack = useCallback(() => {
    router.back();
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
            <Text style={styles.headerTitle}>Verify OTP</Text>
            <Text style={styles.headerSubtitle}>
              Enter the 6-digit code sent to
            </Text>
            <Text style={styles.phoneText}>{email ? email : `+91 ${maskedPhone}`}</Text>
          </View>

          <View style={styles.form}>
            <OTPInput
              value={otp}
              onChange={handleOTPChange}
              inputRefs={inputRefs}
            />
          </View>

          <VerifyButton
            onPress={handleVerify}
            disabled={isButtonDisabled}
            loading={isLoading}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn't receive the code?</Text>
            <Pressable onPress={handleResendOTP} disabled={!canResend}>
              <Text
                style={[
                  styles.linkText,
                  !canResend && styles.linkTextDisabled,
                  canResend && styles.linkTextActive,
                ]}
              >
                {resendTimer > 0
                  ? ` Resend OTP (${resendTimer}s)`
                  : " Resend OTP"}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Change Phone Number</Text>
          </Pressable>

          {/* Info box for demo */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>🔐 Demo OTP</Text>
            <Text style={styles.infoText}>
              {isNewUser === "true" && devOtp
                ? `Use OTP: ${devOtp}`
                : "Check your email/SMS for OTP"}
            </Text>
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
    alignItems: "center",
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
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 16,
    color: "#FC8019",
    fontWeight: "600",
  },
  form: {
    marginBottom: 32,
    width: "100%",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Platform.OS === "web" ? 8 : 8,
    ...Platform.select({
      web: {
        maxWidth: "100%",
        flexWrap: "nowrap",
      },
    }),
  },
  otpInput: {
    flex: 1,
    minWidth: Platform.OS === "web" ? 45 : 40,
    maxWidth: Platform.OS === "web" ? 56 : 60,
    height: 56,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  otpInputFilled: {
    borderColor: "#FC8019",
    backgroundColor: "#FFF5E6",
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
    marginBottom: 16,
    flexWrap: "wrap",
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  linkText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "bold",
    ...Platform.select({ web: { cursor: "not-allowed" } }),
  },
  linkTextDisabled: {
    color: "#999",
    ...Platform.select({ web: { cursor: "not-allowed" } }),
  },
  linkTextActive: {
    color: "#FC8019",
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  backButton: {
    alignItems: "center",
    padding: 12,
    marginBottom: 16,
  },
  backButtonText: {
    color: "#FC8019",
    fontSize: 14,
    fontWeight: "600",
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  infoBox: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
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
});
