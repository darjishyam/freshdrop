import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../context/ToastContext";
import { addToCart } from "../../store/slices/cartSlice";
import {
  cancelOrder as cancelOrderAction,
  loadOrders,
  selectOrders,
  updateOrderStatuses,
} from "../../store/slices/ordersSlice";

export default function OrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  const rawOrders = useSelector(selectOrders);
  const { showToast } = useToast();

  // Ensure orders are sorted by newest first
  const orders = [...rawOrders].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Load orders and start status updates when screen is in focus
  useFocusEffect(
    useCallback(() => {
      dispatch(loadOrders());

      // Start status update interval
      const interval = setInterval(() => {
        dispatch(updateOrderStatuses());
      }, 1000); // Check every second

      return () => clearInterval(interval);
    }, [dispatch])
  );

  // Helper function to check if order can be cancelled
  const canCancelOrder = (status) => {
    // Only "Order Placed" status allows cancellation
    return status === "Order Placed";
  };

  const handleReorder = (order) => {
    // Simple reorder logic - trying to add items back
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        dispatch(
          addToCart({
            ...item,
            id: item.id || item.name,
            quantity: item.quantity || 1,
          })
        );
      });
    } else {
      // Fallback for mock/legacy
      dispatch(
        addToCart({
          id: "reorder-" + order.id,
          name: order.restaurantName + " Order",
          price:
            typeof order.total === "string"
              ? parseInt(order.total.replace("₹", ""))
              : order.total,
          restaurantId: order.id,
          image: order.image,
          quantity: 1,
        })
      );
    }
    router.push("/cart");
  };

  const handleCancel = (item) => {
    // Confirm before cancelling
    dispatch(cancelOrderAction(item.id));
    showToast("Order canceled.");
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() =>
        router.push({ pathname: "/orders/[id]", params: { id: item.id } })
      }
    >
      <View style={styles.orderHeader}>
        <View style={styles.restaurantInfo}>
          <Image
            source={
              typeof item.image === "string" ? { uri: item.image } : item.image
            }
            style={styles.restaurantImage}
          />
          <View>
            <Text style={styles.restaurantName}>{item.restaurantName}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.date).toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.itemsContainer}>
        {item.items.slice(0, 3).map((food, index) => (
          <View key={index} style={styles.itemCard}>
            {food.image && (
              <Image
                source={
                  typeof food.image === "string"
                    ? { uri: food.image }
                    : food.image
                }
                style={styles.itemImage}
              />
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemText} numberOfLines={1}>
                {food.name}
              </Text>
              <Text style={styles.itemQuantity}>Qty: {food.quantity}</Text>
            </View>
          </View>
        ))}
        {item.items.length > 3 && (
          <Text style={styles.moreItemsText}>
            +{item.items.length - 3} more items
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalText}>
          ₹{item.billDetails ? item.billDetails.grandTotal : item.total}
        </Text>
        <View style={styles.actionButtons}>
          {canCancelOrder(item.status) && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={(e) => {
                e.stopPropagation();
                handleCancel(item);
              }}
            >
              <Text style={[styles.actionBtnText, styles.cancelBtnText]}>
                CANCEL
              </Text>
            </TouchableOpacity>
          )}
          {item.status === "Delivered" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.reorderBtn]}
              onPress={(e) => {
                e.stopPropagation();
                handleReorder(item);
              }}
            >
              <Text style={[styles.actionBtnText, styles.reorderBtnText]}>
                REORDER
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (params.fromPayment === "true") {
              router.navigate("/(tabs)/home");
            } else {
              router.back();
            }
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No past orders found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backBtn: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  reorderBtn: {
    backgroundColor: "#FC8019",
    borderColor: "#FC8019",
  },
  cancelBtn: {
    backgroundColor: "#fff",
    borderColor: "#ef4444",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  reorderBtnText: {
    color: "#fff",
  },
  cancelBtnText: {
    color: "#ef4444",
  },
  restaurantImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  orderDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#DEF7EC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#03543F",
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: "#E5E7EB",
  },
  itemInfo: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#6B7280",
  },
  moreItemsText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
    textAlign: "center",
  },
});
