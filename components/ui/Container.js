import React from "react";
import { View, StyleSheet, Platform } from "react-native";

/**
 * Reusable Container Component with responsive padding
 * @param {React.ReactNode} children - Child components
 * @param {object} style - Additional styles
 * @param {boolean} noPadding - Remove default padding (default: false)
 */
export default function Container({ children, style, noPadding = false }) {
  return (
    <View style={[!noPadding && styles.container, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal:
      Platform.OS === "android" ? 20 : Platform.OS === "web" ? 20 : 16,
  },
});
