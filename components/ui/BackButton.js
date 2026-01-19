import React from "react";
import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Reusable Back Button Component (Floating)
 * @param {function} onPress - Back button press handler
 * @param {object} style - Additional styles
 * @param {string} iconColor - Icon color (default: #333)
 * @param {number} iconSize - Icon size (default: 24)
 */
export default function BackButton({
  onPress,
  style,
  iconColor = "#333",
  iconSize = 24,
}) {
  return (
    <TouchableOpacity style={[styles.backButton, style]} onPress={onPress}>
      <Ionicons name="arrow-back" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    left: 16,
    top: 16,
    zIndex: 20,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.1)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
});
