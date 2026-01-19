import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Reusable Page Header Component
 * @param {string} title - Header title
 * @param {function} onBackPress - Back button press handler (optional)
 * @param {React.ReactNode} rightComponent - Right side component (optional)
 * @param {object} style - Additional styles
 */
export default function Header({
  title,
  onBackPress,
  rightComponent,
  style,
  titleStyle,
}) {
  return (
    <View style={[styles.header, style]}>
      {onBackPress && (
        <TouchableOpacity onPress={onBackPress} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      )}
      <Text style={[styles.headerTitle, titleStyle]}>{title}</Text>
      {rightComponent && (
        <View style={styles.rightComponent}>{rightComponent}</View>
      )}
      {!rightComponent && onBackPress && <View style={{ width: 40 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  rightComponent: {
    marginLeft: 16,
  },
});
