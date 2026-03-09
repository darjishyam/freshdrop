import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Reusable Navigation Buttons Component (for horizontal scrolling)
 * @param {function} onLeftPress - Left arrow press handler
 * @param {function} onRightPress - Right arrow press handler
 * @param {boolean} canScrollLeft - Enable/disable left button
 * @param {boolean} canScrollRight - Enable/disable right button
 * @param {object} style - Additional styles
 */
export default function NavigationButtons({
  onLeftPress,
  onRightPress,
  canScrollLeft = false,
  canScrollRight = true,
  style,
}) {
  return (
    <View style={[styles.navButtons, style]}>
      <TouchableOpacity
        style={[styles.navBtn, !canScrollLeft && styles.navBtnDisabled]}
        onPress={onLeftPress}
        disabled={!canScrollLeft}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color={canScrollLeft ? "#4b5563" : "#9ca3af"}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navBtn, !canScrollRight && styles.navBtnDisabled]}
        onPress={onRightPress}
        disabled={!canScrollRight}
      >
        <Ionicons
          name="arrow-forward"
          size={20}
          color={canScrollRight ? "#4b5563" : "#9ca3af"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { cursor: "pointer" },
    }),
  },
  navBtnDisabled: {
    opacity: 0.5,
    backgroundColor: "#f1f2f6",
  },
});
