import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

/**
 * Reusable Section Header Component
 * @param {string} title - Section title
 * @param {React.ReactNode} rightComponent - Right side component (e.g., navigation buttons)
 * @param {object} style - Additional styles
 */
export default function SectionHeader({ title, rightComponent, style }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightComponent && <View>{rightComponent}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "android" ? 20 : 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#020617",
    letterSpacing: -0.5,
  },
});
