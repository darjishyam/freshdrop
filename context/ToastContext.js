import { Ionicons } from "@expo/vector-icons";
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { View, Text, Animated, StyleSheet, Platform } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

const ToastContext = createContext(undefined);

export const ToastProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info"); // 'success', 'error', 'info'
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  const showToast = (msg, toastType = "info") => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);

    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(-50);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2500),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setVisible(false);
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#10B981"; // Emerald Green
      case "error":
        return "#EF4444"; // Red
      case "info":
      default:
        return "#333333"; // Dark Grey
    }
  };

  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      case "info":
      default:
        return "information-circle";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <Animated.View
              style={[
                styles.toastContainer,
                {
                  backgroundColor: getBackgroundColor(),
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                  top: (insets?.top || 20) + 10,
                },
              ]}
            >
              <Ionicons
                name={getIconName()}
                size={24}
                color="#fff"
                style={styles.icon}
              />
              <Text style={styles.toastText}>{message}</Text>
            </Animated.View>
          )}
        </SafeAreaInsetsContext.Consumer>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Provider not ready yet (race condition on mobile) - return no-op function
    console.warn('ToastProvider not ready yet, returning no-op showToast');
    return { showToast: () => { } };
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    zIndex: 9999,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    maxWidth: "90%",
    minWidth: 200,
  },
  icon: {
    marginRight: 10,
  },
  toastText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
});
