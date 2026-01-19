import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  BackHandler,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../context/ToastContext";
import { addToCart } from "../../store/slices/cartSlice";
import { selectOrders } from "../../store/slices/ordersSlice";

export default function OrderCancelledScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const orders = useSelector(selectOrders);
  const { orderId, reason, refundStatus } = useLocalSearchParams();

  const order = orders.find((o) => o.id === orderId);

  // Handle Android Back Button to go Home instead of back to Order flow
  useEffect(() => {
    const backAction = () => {
      router.dismissAll();
      router.replace("/(tabs)/home");
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

  const handleGoHome = () => {
    router.dismissAll();
    router.replace("/(tabs)/home");
  };

  const handleReorder = () => {
    if (order && order.items) {
      order.items.forEach((item) => {
        dispatch(
          addToCart({
            ...item,
            id: item.id || item.name,
            quantity: item.quantity || 1,
            restaurantName: order.restaurantName,
          })
        );
      });
      showToast("Items added to cart");
      router.push("/cart");
    } else {
      router.dismissAll();
      router.replace("/(tabs)/home");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.content,
          Platform.OS === "web" && {
            maxWidth: 600,
            width: "100%",
            alignSelf: "center",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            marginTop: 20,
            borderRadius: 12,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="close-circle" size={80} color="#ef4444" />
        </View>

        <Text style={styles.title}>Order Cancelled</Text>
        <Text style={styles.orderId}>Order #{orderId?.slice(0, 8)}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Cancellation Reason</Text>
          <Text style={styles.value}>{reason || "Changed my mind"}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Refund Status</Text>
          <Text style={styles.value}>
            {refundStatus || "No payment was made"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGoHome}>
            <Text style={styles.primaryBtnText}>Go to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleReorder}>
            <Text style={styles.secondaryBtnText}>Reorder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
    shadowColor: "#ef4444",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    fontFamily: "Poppins_700Bold",
  },
  orderId: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 32,
    fontFamily: "Poppins_400Regular",
  },
  infoCard: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  label: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Poppins_600SemiBold",
  },
  value: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 0,
    fontFamily: "Poppins_500Medium",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#FC8019",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#FC8019",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Poppins_600SemiBold",
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  secondaryBtnText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
});
