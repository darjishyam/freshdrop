import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function WebLoginModal({ visible, onClose }) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleContinue = () => {
    if (phoneNumber === "9999999999") {
      onClose(); // Close modal before navigating
      router.push({
        pathname: "/auth/otp",
        params: { phone: phoneNumber },
      });
    } else {
      alert("Please enter a valid registered number (9999999999)");
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.webModalOverlay}>
      <View style={styles.webModal}>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        {/* @ts-ignore */}
        <Text style={[styles.loginTitle, Platform.OS === "web" && {}]}>
          Login
        </Text>
        <Text style={styles.loginSubtitle}>
          Enter your phone number to proceed
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={[styles.input, { outlineStyle: "none" }]}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={10}
          />
        </View>

        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          {/* @ts-ignore */}
          <Pressable
            onPress={() => {
              onClose();
              router.push("/auth/signup");
            }}
          >
            <Text style={styles.linkText}> Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000, // High z-index to sit on top of everything
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
    width: "100%",
  },
  webModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    width: 400,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
    // @ts-ignore
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  closeBtnText: {
    fontSize: 20,
    color: "#999",
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
    backgroundColor: "#f9f9f9",
  },
  countryCode: {
    fontSize: 16,
    color: "#333",
    marginRight: 12,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
  },
  button: {
    backgroundColor: "#FC8019",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    // @ts-ignore
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  linkText: {
    color: "#FC8019",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
    // @ts-ignore
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
});
