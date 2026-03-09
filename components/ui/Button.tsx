import React from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";

/**
 * Reusable Button Component
 * @param {string} variant - 'primary' | 'secondary' | 'outline' | 'danger'
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {function} onPress - Button press handler
 * @param {string} title - Button text
 * @param {boolean} disabled - Disable button
 * @param {object} style - Additional styles
 */
export default function Button({
  variant = "primary",
  size = "medium",
  onPress,
  title,
  disabled = false,
  style,
  textStyle,
}) {
  const getVariantStyle = () => {
    switch (variant) {
      case "primary":
        return styles.primary;
      case "secondary":
        return styles.secondary;
      case "outline":
        return styles.outline;
      case "danger":
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return styles.small;
      case "medium":
        return styles.medium;
      case "large":
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getTextVariantStyle = () => {
    switch (variant) {
      case "primary":
        return styles.primaryText;
      case "secondary":
        return styles.secondaryText;
      case "outline":
        return styles.outlineText;
      case "danger":
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case "small":
        return styles.smallText;
      case "medium":
        return styles.mediumText;
      case "large":
        return styles.largeText;
      default:
        return styles.mediumText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          getTextVariantStyle(),
          getTextSizeStyle(),
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { cursor: "pointer" },
    }),
  },
  // Variants
  primary: {
    backgroundColor: "#FC8019",
  },
  secondary: {
    backgroundColor: "#22c55e",
  },
  outline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  danger: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  disabled: {
    opacity: 0.5,
  },
  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  large: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  // Text styles
  text: {
    fontWeight: "bold",
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: "#fff",
  },
  outlineText: {
    color: "#333",
  },
  dangerText: {
    color: "#ef4444",
  },
  disabledText: {
    opacity: 0.7,
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
});
