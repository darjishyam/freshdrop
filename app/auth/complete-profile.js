import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  requestOTP,
  selectIsLoading,
  selectUser,
  updateProfile,
} from "../../store/slices/authSlice";

export default function CompleteProfileScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const [phone, setPhone] = useState("");

  const handleSave = async () => {
    console.log("Handle Save Clicked");
    console.log("Current User:", user);
    console.log("Phone Input:", phone);

    if (!user || !user._id) {
      Alert.alert("Error", "User session not found. Please log in again.");
      router.replace("/auth/login");
      return;
    }

    if (phone.length !== 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit number");
      return;
    }

    try {
      console.log("Dispatching updateProfile...");
      // 1. Update Profile with Phone
      const updateResult = await dispatch(
        updateProfile({
          _id: user._id,
          phone: phone,
        })
      ).unwrap();
      console.log("Profile Updated:", updateResult);

      console.log("Requesting OTP...");
      // 2. Send OTP
      await dispatch(requestOTP(phone)).unwrap();
      console.log("OTP Requested");

      // 3. Navigate to OTP Screen
      router.push({
        pathname: "/auth/otp",
        params: { phone: phone, email: user?.email },
      });
    } catch (err) {
      console.error("Error in handleSave:", err);
      Alert.alert("Error", err?.message || "Failed to update phone number");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={isLargeScreen ? styles.card : { width: "100%" }}>
        <Text style={styles.title}>Almost There!</Text>
        <Text style={styles.subtitle}>
          Please enter your mobile number to complete your registration.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === "web" ? "#f4f4f6" : "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    width: "100%",
    marginBottom: 20,
  },
  countryCode: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  button: {
    backgroundColor: "#FC8019",
    width: "100%",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
