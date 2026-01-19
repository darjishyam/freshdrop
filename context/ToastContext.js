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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg) => {
    setMessage(msg);
    setVisible(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
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
                  opacity: fadeAnim,
                  top: (insets?.top || 20) + 10,
                },
              ]}
            >
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
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
