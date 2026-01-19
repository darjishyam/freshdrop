import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { VegNonVegIcon } from "../../components/VegNonVegIcon";
import {
  cancelOrder as cancelOrderAction,
  selectOrders,
  updateOrderStatuses,
} from "../../store/slices/ordersSlice";

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const orders = useSelector(selectOrders);
  const [order, setOrder] = useState(null);

  // Order tracking stages
  const ORDER_STAGES = [
    {
      key: "Order Placed",
      label: "Order Placed",
      icon: "checkmark-circle",
      description: "Payment successful ✔",
      canCancel: true,
    },
    {
      key: "Confirmed",
      label: "Order Confirmed",
      icon: "restaurant",
      description: "Restaurant accepted",
      canCancel: false,
    },
    {
      key: "Preparing",
      label: "Preparing",
      icon: "flame",
      description: "Food is being prepared 🍳",
      canCancel: false,
    },
    {
      key: "Out for Delivery",
      label: "Out for Delivery",
      icon: "bicycle",
      description: "On the way 🛵",
      canCancel: false,
    },
    {
      key: "Delivered",
      label: "Delivered",
      icon: "checkmark-done-circle",
      description: "Order delivered 📦",
      canCancel: false,
    },
  ];

  // Helper function to check if order can be cancelled
  const canCancelOrder = (status) => {
    // Only "Order Placed" status allows cancellation
    return status === "Order Placed";
  };

  // Get current stage index
  const getCurrentStageIndex = (status) => {
    const index = ORDER_STAGES.findIndex((stage) => stage.key === status);
    return index !== -1 ? index : 0;
  };

  const handleCancelOrder = () => {
    if (order) {
      dispatch(cancelOrderAction(order.id));
      router.back();
    }
  };

  useEffect(() => {
    const found = orders.find((o) => o.id === id);
    if (found) setOrder(found);
  }, [id, orders]);

  // Poll for status updates while on this screen
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(updateOrderStatuses());
    }, 1000); // Check every second to match list screen

    return () => clearInterval(interval);
  }, [dispatch]);

  if (!order)
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Order Summary</Text>
          <Text style={styles.headerSub}>{order.restaurantName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Section */}
        <View style={styles.section}>
          <View style={styles.statusRow}>
            <Ionicons
              name={
                ORDER_STAGES[getCurrentStageIndex(order.status)]?.icon ||
                "checkmark-circle"
              }
              size={24}
              color="#22c55e"
            />
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
          {order.status !== "Delivered" && (
            <Text style={styles.etaText}>
              Arriving in {order.eta || "30 mins"}
            </Text>
          )}

          {/* Dynamic Timeline */}
          <View style={styles.timeline}>
            {ORDER_STAGES.map((stage, index) => {
              const currentIndex = getCurrentStageIndex(order.status);
              const isActive = index <= currentIndex;
              const isCurrentStage = index === currentIndex;

              return (
                <View key={stage.key}>
                  <View style={styles.timelineItem}>
                    <Ionicons
                      name={stage.icon}
                      size={20}
                      color={isActive ? "#22c55e" : "#ddd"}
                      style={styles.timelineIcon}
                    />
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineText,
                          isActive && styles.activeTimelineText,
                        ]}
                      >
                        {stage.label}
                      </Text>
                      <Text style={styles.timelineDescription}>
                        {stage.description}
                      </Text>
                      {isCurrentStage && index === 0 && (
                        <Text style={styles.timelineTime}>
                          {new Date(order.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      )}
                      {stage.canCancel && isCurrentStage && (
                        <Text style={styles.cancelAllowedText}>
                          Cancel allowed for short time ⏱️
                        </Text>
                      )}
                      {!stage.canCancel && isCurrentStage && (
                        <Text style={styles.cancelNotAllowedText}>
                          Cancel not allowed ❌
                        </Text>
                      )}
                    </View>
                  </View>
                  {index < ORDER_STAGES.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        isActive && styles.activeTimelineLine,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Driver Section */}
        {order.driverDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Delivery Partner</Text>
            <View style={styles.driverRow}>
              <Image
                source={{ uri: order.driverDetails.image }}
                style={styles.driverImg}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>
                  {order.driverDetails.name}
                </Text>
                <Text style={styles.driverStatus}>Vaccinated • 4.8 ★</Text>
              </View>
              <TouchableOpacity style={styles.callBtn}>
                <Ionicons name="call" size={20} color="#fc8019" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Items Ordered</Text>
          {order.items.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.itemRow,
                idx === order.items.length - 1 && styles.lastItemRow,
              ]}
            >
              {/* Product Image */}
              {item.image && (
                <Image
                  source={
                    typeof item.image === "string"
                      ? { uri: item.image }
                      : item.image
                  }
                  style={styles.itemImage}
                />
              )}
              <View style={styles.itemDetails}>
                <View style={styles.itemNameRow}>
                  <View style={{ marginRight: 8 }}>
                    <VegNonVegIcon veg={item.veg} size={14} />
                  </View>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <View style={styles.itemPriceRow}>
                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyText}>{item.quantity || 0}</Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    ₹{(item.price || 0) * (item.quantity || 0)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bill Details */}
        {order.billDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>
                ₹{order.billDetails.itemTotal}
              </Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>
                ₹{order.billDetails.deliveryFee}
              </Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes & Charges</Text>
              <Text style={styles.billValue}>₹{order.billDetails.taxes}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.billRow}>
              <Text style={styles.totalLabel}>To Pay</Text>
              <Text style={styles.totalValue}>
                ₹{order.billDetails.grandTotal}
              </Text>
            </View>
          </View>
        )}

        {/* Order Details Footer */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Order Details</Text>
          <Text style={styles.detailLabel}>Order ID</Text>
          <Text style={styles.detailValue}>{order.id}</Text>

          {order.paymentDetails && (
            <>
              <Text style={[styles.detailLabel, { marginTop: 12 }]}>
                Payment
              </Text>
              <Text style={styles.detailValue}>
                {order.paymentDetails.method || "N/A"} (
                {order.paymentDetails.status || "PENDING"})
              </Text>
            </>
          )}

          {order.customerDetails && (
            <>
              <Text style={[styles.detailLabel, { marginTop: 12 }]}>
                Deliver to
              </Text>
              <Text style={styles.detailValue}>
                {order.customerDetails.address || "N/A"}
              </Text>
            </>
          )}
        </View>

        {/* Cancel Order Button */}
        {canCancelOrder(order.status) && (
          <TouchableOpacity
            style={styles.cancelOrderButton}
            onPress={handleCancelOrder}
          >
            <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
            <Text style={styles.cancelOrderText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F0F5",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  headerSub: { fontSize: 12, color: "#666" },
  scrollContent: { padding: 16 },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  statusText: { fontSize: 18, fontWeight: "bold", marginLeft: 8 },
  etaText: { fontSize: 14, color: "#666", marginBottom: 16, marginLeft: 32 },
  timeline: { marginTop: 16 },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 8,
  },
  timelineIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineText: {
    fontSize: 15,
    color: "#999",
    fontWeight: "500",
  },
  activeTimelineText: {
    color: "#333",
    fontWeight: "bold",
  },
  timelineDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: "#ddd",
    marginLeft: 10,
    marginVertical: 2,
  },
  activeTimelineLine: {
    backgroundColor: "#22c55e",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ddd",
    marginRight: 12,
  },
  activeDot: { backgroundColor: "#22c55e" },
  timelineTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  cancelAllowedText: {
    fontSize: 11,
    color: "#f59e0b",
    fontWeight: "600",
    marginTop: 4,
  },
  cancelNotAllowedText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "600",
    marginTop: 4,
  },

  sectionHeader: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  driverRow: { flexDirection: "row", alignItems: "center" },
  driverImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  driverName: { fontWeight: "bold", fontSize: 16 },
  driverStatus: { color: "#666", fontSize: 12 },
  callBtn: { padding: 10, backgroundColor: "#FFF5E6", borderRadius: 20 },

  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lastItemRow: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vegIcon: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: "green",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 4,
  },
  vegDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "green" },
  itemRight: { alignItems: "flex-end" },
  qtyBox: {
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    marginBottom: 4,
  },
  qtyText: { fontSize: 10, fontWeight: "bold" },
  itemPrice: { fontSize: 12, color: "#333" },

  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  billLabel: { fontSize: 14, color: "#666" },
  billValue: { fontSize: 14, color: "#333" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: "bold" },
  totalValue: { fontSize: 16, fontWeight: "bold" },

  detailLabel: { fontSize: 12, color: "#999", textTransform: "uppercase" },
  detailValue: { fontSize: 14, color: "#333", marginTop: 4 },

  cancelOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: "#ef4444",
    gap: 8,
  },
  cancelOrderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
  },
});
