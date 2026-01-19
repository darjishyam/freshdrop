import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  clearError,
  requestOTP,
  selectError,
  selectIsLoading,
} from "../../store/slices/authSlice";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [email, setEmail] = useState("");

  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const handleSendOtp = useCallback(async () => {
    if (!isEmailValid) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }
    try {
      await dispatch(requestOTP({ email, type: "forgot-password" })).unwrap();
      // Navigate to OTP screen with email and type
      router.push({
        pathname: "/auth/otp",
        params: { email, type: "forgot-password" },
      });
    } catch (err) {
      // Don't alert if it's the inline validation error
      if (err && !err.toString().includes("User not found")) {
        Alert.alert("Error", err || "Failed to send OTP");
      }
    }
  }, [email, isEmailValid, dispatch, router]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <View style={isLargeScreen ? styles.webCard : { width: "100%" }}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.headerTitle}>Forgot Password</Text>
              <Text style={styles.headerSubtitle}>
                Enter your email to receive a reset code
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) dispatch(clearError());
                  }}
                  autoCapitalize="none"
                />
              </View>
              {error && error.includes("User not found") && (
                <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                  User not found with this email
                </Text>
              )}

              <View style={{ height: 24 }} />

              <Pressable
                style={[
                  styles.button,
                  (isLoading || !isEmailValid) && styles.buttonDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={isLoading || !isEmailValid}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Code</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
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
    width: "100%",
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
  backButton: {
    position: "absolute",
    top: 24,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
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
});
