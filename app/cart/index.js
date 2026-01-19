import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { VegNonVegIcon } from "../../components/VegNonVegIcon";
import { useToast } from "../../context/ToastContext";
import { restaurants } from "../../data/mockData";
import {
  clearCart,
  selectCartItems,
  selectCartTotal,
  updateQuantity,
} from "../../store/slices/cartSlice";
import { addOrder } from "../../store/slices/ordersSlice";
import { selectUser } from "../../store/slices/userSlice";
export default function CartScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const user = useSelector(selectUser);
  const { showToast } = useToast();
  const { mode } = useLocalSearchParams();
  const [paymentMode, setPaymentMode] = useState(mode === "payment");
  const [upiId, setUpiId] = useState("");
  const [selectedApp, setSelectedApp] = useState("");

  // Update paymentMode if param changes (e.g. coming back from GPay cancel)
  useEffect(() => {
    if (mode === "payment") {
      setPaymentMode(true);
    }
  }, [mode]);

  const handleCheckout = () => {
    setPaymentMode(true);
  };

  // Payment State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null); // null = closed, 'card', 'upi'

  // Card Details State
  const [cardDetails, setCardDetails] = useState({
    number: "",
    cvv: "",
    expiry: "",
    name: "",
  });

  // Calculate taxes and fees based on cart total
  const taxes = Math.round(cartTotal * 0.05); // 5% GST

  // Dynamic delivery fee like Swiggy/Zomato
  // Free delivery for orders above ₹500
  // ₹25 for orders between ₹200-₹500
  // ₹40 for orders below ₹200
  const deliveryFee = cartTotal >= 500 ? 0 : cartTotal >= 200 ? 25 : 40;

  const grandTotal = Math.round(cartTotal + taxes + deliveryFee);

  // Updated Payment Handler
  const handlePayment = () => {
    // Basic validation based on selected method
    if (selectedPaymentMethod === "card") {
      if (
        !cardDetails.number ||
        !cardDetails.cvv ||
        !cardDetails.expiry ||
        !cardDetails.name
      ) {
        Alert.alert("Error", "Please fill in all card details");
        return;
      }
    } else if (selectedPaymentMethod === "upi") {
      if (!selectedApp) {
        Alert.alert("Error", "Please select a UPI app");
        return;
      }
    }

    // Get restaurant image from restaurants data
    const firstItem = cartItems[0];
    const restaurant = restaurants.find(
      (r) =>
        r.id === firstItem?.restaurantId || r.name === firstItem?.restaurantName
    );
    const restaurantImage = restaurant?.image || firstItem?.image;

    // Create order object
    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: "Order Placed",
      restaurantName: cartItems[0]?.restaurantName || "Food Order",
      restaurantAddress: "123 Food Street, Tasty City",
      image: restaurantImage,
      items: cartItems,
      billDetails: {
        itemTotal: cartTotal,
        taxes: taxes,
        deliveryFee: deliveryFee,
        discount: 0,
        grandTotal: grandTotal,
      },
      customerDetails: {
        name: user.name || "User",
        address: user.address || "Home Address",
        phone: user.phone || "9999999999",
      },
      paymentDetails: {
        method: selectedPaymentMethod.toUpperCase(),
        status: "PAID",
      },
      driverDetails: {
        name: "Ramesh Kumar",
        phone: "9876543210",
        image: "https://cdn-icons-png.flaticon.com/512/3011/3011166.png",
      },
      eta: "35 mins",
    };

    // If GPay is selected, navigate to GPay payment page
    if (selectedPaymentMethod === "upi" && selectedApp === "gpay") {
      router.push({
        pathname: "/payment/gpay",
        params: {
          orderData: JSON.stringify(newOrder),
          amount: grandTotal.toString(),
        },
      });
    } else if (selectedPaymentMethod === "upi" && selectedApp === "phonepe") {
      router.push({
        pathname: "/payment/phonepe",
        params: {
          orderData: JSON.stringify(newOrder),
          amount: grandTotal.toString(),
        },
      });
    } else if (selectedPaymentMethod === "upi" && selectedApp === "paytm") {
      router.push({
        pathname: "/payment/paytm",
        params: {
          orderData: JSON.stringify(newOrder),
          amount: grandTotal.toString(),
        },
      });
    } else {
      // For other payment methods, process immediately
      showToast("Payment Successful! Your order has been placed.");
      dispatch(addOrder(newOrder));
      dispatch(clearCart());
      router.replace("/orders");
    }
  };

  if (paymentMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.container,
            Platform.OS === "web" && styles.webContainer,
          ]}
        >
          {/* Header */}
          <View style={styles.paymentHeader}>
            <TouchableOpacity onPress={() => setPaymentMode(false)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.paymentHeaderTitle}>Payment</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.paymentScrollView}
            contentContainerStyle={styles.paymentContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.selectMethodTitle}>Select Payment Method</Text>

            {/* Accordion: Debit / Credit Card */}
            <View style={styles.accordionItem}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() =>
                  setSelectedPaymentMethod(
                    selectedPaymentMethod === "card" ? null : "card"
                  )
                }
              >
                <View style={styles.accordionHeaderLeft}>
                  <Ionicons name="card-outline" size={24} color="#4b5563" />
                  <Text style={styles.accordionTitle}>Debit / Credit Card</Text>
                </View>
                <Ionicons
                  name={
                    selectedPaymentMethod === "card"
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>

              {selectedPaymentMethod === "card" && (
                <View style={styles.accordionBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Card Number</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="1234-5678-9876-4321"
                      value={cardDetails.number}
                      onChangeText={(t) =>
                        setCardDetails({ ...cardDetails, number: t })
                      }
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.rowInputs}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}
                    >
                      <Text style={styles.inputLabel}>CVV/CVC No.</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChangeText={(t) =>
                          setCardDetails({ ...cardDetails, cvv: t })
                        }
                        keyboardType="numeric"
                        maxLength={3}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Valid Thru</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="MM/YYYY"
                        value={cardDetails.expiry}
                        onChangeText={(t) =>
                          setCardDetails({ ...cardDetails, expiry: t })
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Full Name"
                      value={cardDetails.name}
                      onChangeText={(t) =>
                        setCardDetails({ ...cardDetails, name: t })
                      }
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.sendOtpBtn}
                    onPress={handlePayment}
                  >
                    <Text style={styles.sendOtpText}>Pay ₹{grandTotal}</Text>
                  </TouchableOpacity>

                  <View style={styles.saveDetailsRow}>
                    <TouchableOpacity style={styles.checkbox} />
                    <Text style={styles.saveDetailsText}>
                      Save details for future
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Accordion: UPI */}
            <View style={styles.accordionItem}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() =>
                  setSelectedPaymentMethod(
                    selectedPaymentMethod === "upi" ? null : "upi"
                  )
                }
              >
                <View style={styles.accordionHeaderLeft}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#4b5563",
                      width: 24,
                      textAlign: "center",
                    }}
                  >
                    ₹
                  </Text>
                  <Text style={styles.accordionTitle}>UPI</Text>
                </View>
                <Ionicons
                  name={
                    selectedPaymentMethod === "upi"
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>

              {selectedPaymentMethod === "upi" && (
                <View style={styles.accordionBody}>
                  <View style={styles.upiAppsContainer}>
                    {/* Google Pay */}
                    <TouchableOpacity
                      style={[
                        styles.upiAppItem,
                        selectedApp === "gpay" && styles.upiAppSelected,
                      ]}
                      onPress={() => setSelectedApp("gpay")}
                    >
                      <Image
                        source={{
                          uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png",
                        }}
                        style={{ width: 60, height: 24 }}
                        resizeMode="contain"
                      />
                      {selectedApp === "gpay" && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#22c55e"
                          style={{ marginLeft: "auto" }}
                        />
                      )}
                    </TouchableOpacity>

                    {/* PhonePe */}
                    <TouchableOpacity
                      style={[
                        styles.upiAppItem,
                        selectedApp === "phonepe" && styles.upiAppSelected,
                      ]}
                      onPress={() => setSelectedApp("phonepe")}
                    >
                      <Image
                        source={{
                          uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png",
                        }}
                        style={{ width: 90, height: 28 }}
                        resizeMode="contain"
                      />
                      {selectedApp === "phonepe" && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#22c55e"
                          style={{ marginLeft: "auto" }}
                        />
                      )}
                    </TouchableOpacity>

                    {/* Paytm */}
                    <TouchableOpacity
                      style={[
                        styles.upiAppItem,
                        selectedApp === "paytm" && styles.upiAppSelected,
                      ]}
                      onPress={() => setSelectedApp("paytm")}
                    >
                      <Image
                        source={{
                          uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png",
                        }}
                        style={{ width: 70, height: 24 }}
                        resizeMode="contain"
                      />
                      {selectedApp === "paytm" && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#22c55e"
                          style={{ marginLeft: "auto" }}
                        />
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.sendOtpBtn}
                    onPress={handlePayment}
                  >
                    <Text style={styles.sendOtpText}>Pay ₹{grandTotal}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.floatingBackBtn}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <View
        style={[styles.container, Platform.OS === "web" && styles.webContainer]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 40 }} />
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.center}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/11329/11329060.png",
              }}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Good food is always cooking! Go ahead, order some yummy items from
              the menu.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push("/(tabs)/home")}
            >
              <Text style={styles.browseText}>See Restaurants Near You</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cartItem}
                  onPress={() =>
                    router.push({
                      pathname: "/product/[id]",
                      params: { id: item.name },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Image
                    source={
                      typeof item.image === "string"
                        ? { uri: item.image }
                        : item.image
                    }
                    style={styles.itemImage}
                  />
                  <View style={styles.itemInfo}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <VegNonVegIcon veg={item.veg} size={14} />
                      <Text style={[styles.itemName, { marginLeft: 6 }]}>
                        {item.name}
                      </Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      ₹{item.price * item.quantity}
                    </Text>
                  </View>
                  <View style={styles.qtyContainer}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        dispatch(
                          updateQuantity({ itemId: item.id, delta: -1 })
                        );
                      }}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (item.quantity >= 10) return;
                        dispatch(updateQuantity({ itemId: item.id, delta: 1 }));
                      }}
                      style={[
                        styles.qtyBtn,
                        item.quantity >= 10 && { opacity: 0.5 },
                      ]}
                      disabled={item.quantity >= 10}
                    >
                      <Text
                        style={[
                          styles.qtyText,
                          item.quantity >= 10 && { color: "gray" },
                        ]}
                      >
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            />
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total To Pay</Text>
                <Text style={styles.totalValue}>₹{cartTotal}</Text>
              </View>
              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutText}>Proceed to Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start", // Left align
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    position: "relative",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  floatingBackBtn: {
    position: "absolute",
    left: 16,
    top: 16,
    zIndex: 20,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.1)" },
      default: { elevation: 3 },
    }),
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
  },
  browseBtn: {
    marginTop: 20,
    backgroundColor: "#FC8019",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtn: {
    marginRight: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "#fff",
  },
  emptyImage: {
    width: 250,
    height: 250,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  browseBtn: {
    backgroundColor: "#FC8019",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#FC8019",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: {
    padding: 20,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemPrice: {
    color: "#666",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyText: {
    fontSize: 18,
    color: "green",
    fontWeight: "bold",
  },
  qtyVal: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  checkoutBtn: {
    backgroundColor: "#FC8019",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  paymentHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  paymentScrollView: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  paymentContent: {
    padding: Platform.OS === "web" ? 32 : 20,
    paddingBottom: 40,
    backgroundColor: "#f9fafb",
  },
  selectMethodTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 20,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  accordionItem: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Platform.OS === "web" ? 16 : 18,
    backgroundColor: "#fff",
    minHeight: 60,
  },
  accordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  accordionTitle: {
    fontSize: Platform.OS === "web" ? 16 : 15,
    fontWeight: "600",
    color: "#374151",
  },
  accordionBody: {
    padding: Platform.OS === "web" ? 24 : 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
    fontWeight: "600",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#fff",
    minHeight: 48,
    ...Platform.select({
      web: { outlineStyle: "none" },
    }),
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  sendOtpBtn: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  sendOtpText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  saveDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "#9ca3af",
    borderRadius: 4,
  },
  saveDetailsText: {
    fontSize: 14,
    color: "#4b5563",
  },
  bankList: {
    gap: 0,
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  bankIconPlaceholder: {
    width: 36,
    height: 36,
    backgroundColor: "#f3f4f6",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  bankName: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  upiAppsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  upiAppItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    height: 56,
  },
  upiAppSelected: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  webContainer: {
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#f0f0f0",
  },
});
