import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  resetPassword,
  selectError,
  selectIsLoading,
} from "../../store/slices/authSlice";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const { email, otp } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  // Validation checks
  const isPasswordValid = useMemo(() => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (any symbol)
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(newPassword);
  }, [newPassword]);

  const doPasswordsMatch = useMemo(() => {
    if (confirmPassword.length === 0) return true; // Don't show error until user types
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const isFormValid = useMemo(() => {
    return isPasswordValid && doPasswordsMatch && confirmPassword.length > 0;
  }, [isPasswordValid, doPasswordsMatch, confirmPassword]);

  const handleResetPassword = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert("Invalid Input", "Please check your passwords");
      return;
    }

    try {
      await dispatch(resetPassword({ email, otp, newPassword })).unwrap();

      Alert.alert("Success", "Password reset successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Redirect to authenticated home page
            router.replace("/(tabs)/home");
          },
        },
      ]);
    } catch (err) {
      Alert.alert("Error", err || "Failed to reset password");
    }
  }, [email, otp, newPassword, isFormValid, dispatch, router]);

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
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Set New Password</Text>
              <Text style={styles.headerSubtitle}>Enter your new password</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password (min 8 chars, Strong)"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 8 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="#666"
                  />
                </Pressable>
              </View>
              {newPassword.length > 0 && !isPasswordValid && (
                <Text style={styles.validErrorText}>
                  Password must be 8+ chars, 1 Upper, 1 Lower, 1 Number, 1
                  Special
                </Text>
              )}

              <View style={{ height: 16 }} />

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ padding: 8 }}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={24}
                    color="#666"
                  />
                </Pressable>
              </View>
              {confirmPassword.length > 0 && !doPasswordsMatch && (
                <Text style={styles.errorText}>Password is different</Text>
              )}

              <View style={{ height: 24 }} />

              <Pressable
                style={[styles.button, !isFormValid && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
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
  header: {
    marginBottom: 32,
    alignItems: "center",
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
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  validErrorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
});
