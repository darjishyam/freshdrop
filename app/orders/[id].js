import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../constants/api";
import LiveMap from "../../components/LiveMap";
import {
  Animated,
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
  orderUpdated,
} from "../../store/slices/ordersSlice";
import SocketService from "../../services/socketService";

// Helpers
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  // specific format for timeline
  return isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatPrice = (price) => {
  if (typeof price === "string") {
    price = parseFloat(price.replace(/[^0-9.]/g, ""));
  }
  const num = Number(price);
  return isNaN(num) ? "0" : num.toString();
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const orders = useSelector(selectOrders);
  const [order, setOrder] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});
  // ✅ NEW: Live tracking state
  const [driverCoords, setDriverCoords] = useState(null);
  const [trackingEta, setTrackingEta] = useState(null);
  const mapRef = useRef(null);

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
      key: "Ready",
      label: "Food Ready",
      icon: "timer",
      description: "Waiting for delivery partner 🛵",
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

  const handleCancelOrder = async () => {
    if (order) {
      try {
        const resultAction = await dispatch(cancelOrderAction(order._id || order.id));
        if (cancelOrderAction.fulfilled.match(resultAction)) {
          router.back();
        } else {
          // You might have a showToast helper here, if not, it will be handled by the slice errors
          console.error("Failed to cancel order:", resultAction.payload);
        }
      } catch (error) {
        console.error("Unexpected error during cancellation:", error);
      }
    }
  };

  useEffect(() => {
    const found = orders.find((o) => o._id === id || o.id === id);
    if (found) {
      setOrder(found);
      // Auto-expand all completed stages initially
      const idx = getCurrentStageIndex(found.status);
      const initialExpanded = {};
      for (let i = 0; i <= idx; i++) {
        initialExpanded[i] = true;
      }
      setExpandedSteps(initialExpanded);
    } else {
      // Not in Redux yet — fetch directly from API
      const fetchOrder = async () => {
        try {
          const token = await AsyncStorage.getItem("auth_token");
          if (!token) return;
          const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setOrder(data);
            const idx = getCurrentStageIndex(data.status);
            const initialExpanded = {};
            for (let i = 0; i <= idx; i++) initialExpanded[i] = true;
            setExpandedSteps(initialExpanded);
          }
        } catch (e) {
          console.error("Failed to fetch order:", e);
        }
      };
      fetchOrder();
    }
  }, [id, orders]);

  // Real-time Status Updates via Socket
  useEffect(() => {
    let cleanupSocket = () => { };

    const setupSocket = async () => {
      await SocketService.connect();

      const eventName = `order_${id}`;
      console.log("Listening for updates on:", eventName);

      SocketService.on(eventName, (updatedOrder) => {
        console.log("Received update for order:", updatedOrder._id, updatedOrder.status);
        dispatch(orderUpdated(updatedOrder));
        setOrder(updatedOrder); // Update local state immediately for smoother UX
      });

      // ✅ NEW: Listen for live driver location updates
      SocketService.on("driverLocationUpdate", (data) => {
        if (data.orderId?.toString() === id?.toString()) {
          const coords = { latitude: parseFloat(data.latitude), longitude: parseFloat(data.longitude) };
          setDriverCoords(coords);
          setTrackingEta(data.etaMinutes);
          // Animate map to center on driver
          if (mapRef.current && mapRef.current.animateToRegion) {
            mapRef.current.animateToRegion({
              ...coords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 800);
          }
        }
      });

      cleanupSocket = () => {
        SocketService.off(eventName);
        SocketService.off("driverLocationUpdate");
      };
    };

    setupSocket();

    return () => {
      cleanupSocket();
    };
  }, [id, dispatch]);

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
          <Text style={styles.headerSub}>{order.restaurant?.name || order.restaurantName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ✅ LIVE TRACKING MAP — shown only when Out for Delivery */}
        {order.status === "Out for Delivery" && (
          <View style={styles.mapSection}>
            <View style={styles.mapHeaderRow}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.mapTitle}>Driver on the way 🛵</Text>
              {trackingEta && (
                <Text style={styles.etaChip}>~{trackingEta} min</Text>
              )}
            </View>

            {driverCoords ? (
              <LiveMap
                ref={mapRef}
                driverCoords={driverCoords}
                order={order}
                customStyles={styles}
              />
            ) : (
              <View style={styles.mapLoading}>
                <Ionicons name="location-outline" size={32} color="#FC8019" />
                <Text style={styles.mapLoadingText}>Waiting for driver location...</Text>
                <Text style={styles.mapLoadingSub}>Map will appear once driver starts moving</Text>
              </View>
            )}

            {/* Legend */}
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <Text style={styles.legendDot}>🛵</Text>
                <Text style={styles.legendLabel}>Driver</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendCircle, { backgroundColor: "#FC8019" }]} />
                <Text style={styles.legendLabel}>Restaurant</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendCircle, { backgroundColor: "#22c55e" }]} />
                <Text style={styles.legendLabel}>You</Text>
              </View>
            </View>
          </View>
        )}

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

          {/* Interactive Dynamic Timeline */}
          <View style={styles.timeline}>
            {ORDER_STAGES.map((stage, index) => {
              const currentIndex = getCurrentStageIndex(order.status);
              const isCompleted = index <= currentIndex;
              const isActive = index === currentIndex;
              const isExpanded = !!expandedSteps[index];

              return (
                <View key={stage.key} style={styles.timelineItemContainer}>
                  {/* Vertical Railway Lane (Line) */}
                  <View style={styles.leftColumn}>
                    {/* Dot */}
                    <View
                      style={[
                        styles.dot,
                        isCompleted && styles.activeDot,
                        isActive && styles.currentDot, // Special style for "current train stop"
                      ]}
                    >
                      {isCompleted && (
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      )}
                    </View>
                    {/* Line Connection */}
                    {index < ORDER_STAGES.length - 1 && (
                      <View
                        style={[
                          styles.line,
                          index < currentIndex && styles.activeLine,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.rightColumn}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.timelineHeader}
                      onPress={() =>
                        setExpandedSteps((prev) => ({
                          ...prev,
                          [index]: !prev[index],
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.timelineTitle,
                          isCompleted && styles.activeTimelineTitle,
                        ]}
                      >
                        {stage.label}
                      </Text>
                      {/* Chevron Icon indicating expansion */}
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={isCompleted ? "#333" : "#ccc"}
                        style={{ marginLeft: 8 }}
                      />
                    </TouchableOpacity>

                    {/* Drop Down Content - Accordion */}
                    {isExpanded && (
                      <View style={styles.timelineBody}>
                        <Text style={styles.timelineDescription}>
                          {stage.description}
                        </Text>
                        {/* Only show time if this step is completed or active */}
                        {isCompleted && (
                          <Text style={styles.timelineTime}>
                            {formatDate(order.updatedAt || order.createdAt || order.date || Date.now())}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
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
            {/* Rate Driver Button - Only if Delivered */}
            {order.status === "Delivered" && (
              <TouchableOpacity
                style={styles.rateDriverBtn}
                onPress={() =>
                  router.push({
                    pathname: "/reviews/add",
                    params: {
                      orderId: order._id || order.id,
                      driverId: order.driverDetails.id || order.driver._id || order.driver,
                      driverName: order.driverDetails.name,
                      productName: "Delivery Partner", // Generic name for review screen
                    },
                  })
                }
              >
                <Ionicons name="star-outline" size={16} color="#FC8019" />
                <Text style={styles.rateDriverText}>Rate Driver</Text>
              </TouchableOpacity>
            )}
          </View>
        )
        }

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Items Ordered</Text>
          {(order.items || []).map((item, idx) => (
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
                  source={(() => {
                    const img = item.image;
                    if (typeof img === "string") {
                      if (img.trim().startsWith("{")) {
                        try {
                          return JSON.parse(img);
                        } catch (e) { }
                      }
                      if (
                        !isNaN(img) &&
                        img.trim() !== "" &&
                        !img.startsWith("http")
                      )
                        return parseInt(img);
                      return { uri: img };
                    }
                    return img;
                  })()}
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
                    ₹
                    {formatPrice(
                      (parseFloat(item.price) || 0) * (item.quantity || 0)
                    )}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>
              ₹{formatPrice(order.billDetails ? order.billDetails.itemTotal : order.totalAmount)}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>
              ₹{formatPrice(order.billDetails ? order.billDetails.deliveryFee : 0)}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & Charges</Text>
            <Text style={styles.billValue}>
              ₹{formatPrice(order.billDetails ? order.billDetails.taxes : 0)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>
              ₹{formatPrice(order.billDetails ? order.billDetails.grandTotal : order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Order Details Footer */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Order Details</Text>
          <Text style={styles.detailLabel}>Order ID</Text>
          <Text style={styles.detailValue}>{order._id || order.id}</Text>

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
        {
          canCancelOrder(order.status) && (
            <TouchableOpacity
              style={styles.cancelOrderButton}
              onPress={handleCancelOrder}
            >
              <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
              <Text style={styles.cancelOrderText}>Cancel Order</Text>
            </TouchableOpacity>
          )
        }

        {/* Write Review Section - Only for Delivered Orders */}
        {
          order.status === "Delivered" && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>How was your order?</Text>
              <Text style={styles.reviewSectionSubtitle}>Rate your experience</Text>
              {order.items.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.reviewItemCard}
                  onPress={() =>
                    router.push({
                      pathname: "/reviews/add",
                      params: {
                        orderId: order._id || order.id,
                        restaurantId: order.restaurant?._id || order.restaurant,
                        productId: item.product || item.id || item.name,
                        productName: item.name,
                        productImage: item.image,
                      },
                    })
                  }
                >
                  <View style={styles.reviewItemInfo}>
                    {item.image && (
                      <Image
                        source={(() => {
                          const img = item.image;
                          if (typeof img === "string") {
                            if (img.trim().startsWith("{")) {
                              try {
                                return JSON.parse(img);
                              } catch (e) { }
                            }
                            if (
                              !isNaN(img) &&
                              img.trim() !== "" &&
                              !img.startsWith("http")
                            )
                              return parseInt(img);
                            return { uri: img };
                          }
                          return img;
                        })()}
                        style={styles.reviewItemImage}
                      />
                    )}
                    <Text style={styles.reviewItemName}>{item.name}</Text>
                  </View>
                  <View style={styles.reviewButton}>
                    <Ionicons name="star-outline" size={18} color="#FC8019" />
                    <Text style={styles.reviewButtonText}>Rate</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        }
      </ScrollView >
    </View >
  );
}

const styles = StyleSheet.create({
  // Map styles
  mapSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingBottom: 8,
    gap: 8,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ef4444",
    letterSpacing: 1,
  },
  mapTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  etaChip: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#FC8019",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  map: {
    width: "100%",
    height: 220,
  },
  mapLoading: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    gap: 8,
    margin: 8,
    borderRadius: 8,
  },
  mapLoadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  mapLoadingSub: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  driverMarker: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "#FC8019",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  driverMarkerText: {
    fontSize: 20,
  },
  mapLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    fontSize: 14,
  },
  legendCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: "#666",
  },
  // Original styles
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
  timelineItemContainer: {
    flexDirection: "row",
    minHeight: 60,
  },
  leftColumn: {
    alignItems: "center",
    width: 40,
    marginRight: 8,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    marginTop: 2,
  },
  activeDot: {
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  currentDot: {
    borderWidth: 2,
    borderColor: "#15803d",
    transform: [{ scale: 1.2 }],
    shadowColor: "#15803d",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: "#e5e7eb",
    marginVertical: 4,
  },
  activeLine: {
    backgroundColor: "#22c55e",
  },
  rightColumn: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  timelineTitle: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "600",
  },
  activeTimelineTitle: {
    color: "#111827",
    fontWeight: "bold",
  },
  timelineBody: {
    marginTop: 6,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#22c55e",
  },
  timelineText: {
    fontSize: 15,
    color: "#999",
    fontWeight: "500",
  },
  timelineDescription: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
  },
  timelineTime: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 6,
    textAlign: "right",
    fontStyle: "italic",
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
  rateDriverBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FC8019",
    borderRadius: 8,
    gap: 8,
  },
  rateDriverText: {
    color: "#FC8019",
    fontSize: 14,
    fontWeight: "bold",
  },
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
  // Review Section Styles
  reviewSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  reviewSectionSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
  },
  reviewItemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewItemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reviewItemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
  },
  reviewItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5E6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FC8019",
  },
});
