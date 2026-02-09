import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { useToast } from "../../context/ToastContext";
import { clearCart } from "../../store/slices/cartSlice";
import { addOrder } from "../../store/slices/ordersSlice";
import { deductStock } from "../../store/slices/stockSlice";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Rupee Symbol Component
const RupeeSymbol = () => <Text>₹</Text>;

export default function GPayPaymentScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  // const { addOrder } = useOrders(); // Removed Context
  const { showToast } = useToast();
  const params = useLocalSearchParams();

  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [showPin, setShowPin] = useState(false); // [NEW] Pin Mode
  const [pin, setPin] = useState("");
  const timerRef = useRef(null);
  const redirectTimerRef = useRef(null);

  // Animation values for success screen
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Parse the amount from params
  const amount = params.amount
    ? Math.round(parseFloat(params.amount)).toString()
    : "0";

  // Generate realistic transaction ID (Google/UPI style)
  const generateTransactionId = useCallback(() => {
    // Generate a random 12-digit number like a UPI/Bank Ref ID
    const randomRef = Math.floor(Math.random() * 1000000000000)
      .toString()
      .padStart(12, "0");
    return randomRef;
  }, []);

  // Handle Pay button click - SHOW PIN SCREEN FIRST
  const handlePayClick = useCallback(() => {
    setShowPin(true);
  }, []);

  // Handle PIN Submit - START PROCESSING
  const handlePinSubmit = useCallback(() => {
    if (pin.length !== 4) {
      showToast("Please enter 4-digit UPI PIN");
      return;
    }
    setShowPin(false);
    startProcessing();
  }, [pin]);

  // Handle PIN Input
  const handlePinPress = (digit) => {
    if (digit === "backspace") {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const startProcessing = useCallback(async () => {
    console.log("PIN Verified! Starting Payment...");

    // Start processing immediately
    setProcessing(true);
    const txnId = generateTransactionId();
    setTransactionId(txnId);

    // Simulate payment processing (4 seconds)
    timerRef.current = setTimeout(async () => {
      setProcessing(false);
      setPaymentSuccess(true);
      // ... (rest of logic) ...
      // Parse order data and add order FIRST before showing success
      try {
        const orderData = params.orderData
          ? JSON.parse(params.orderData)
          : null;
        if (orderData) {
          const orderPayload = {
            ...orderData,
            transactionId: txnId,
          };
          await dispatch(addOrder(orderPayload)).unwrap();
          if (orderPayload.items) {
            dispatch(deductStock(orderPayload.items));
          }
          dispatch(clearCart());
        }
      } catch (error) {
        console.error("Error processing order:", error);
      }

      // Trigger success animation
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]).start(() => {
        redirectTimerRef.current = setTimeout(() => {
          showToast("Payment Successful! Redirecting to Orders...");
          router.replace({ pathname: "/orders", params: { fromPayment: "true" } });
        }, 1500);
      });
    }, 4000); // 4 seconds processing
  }, [amount, generateTransactionId, scaleAnim, fadeAnim, params, dispatch, showToast, router]);

  // Handle cancel payment
  const handleCancelPayment = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    showToast("Payment cancelled");
    router.back();
  }, [router, showToast]);

  const handleDone = useCallback(() => {
    router.replace({ pathname: "/orders", params: { fromPayment: "true" } });
  }, [router]);

  // ... useEffects ...

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        {showPin ? (
          // PIN ENTRY SCREEN
          <View style={styles.pinContainer}>
            {/* Header */}
            <View style={styles.pinHeader}>
              <Text style={styles.pinHeaderTitle}>Google Pay</Text>
              <Text style={styles.pinHeaderSubtitle}>USER@okaxis</Text>
            </View>

            <View style={styles.pinBody}>
              <View style={styles.pinTopRow}>
                <Text style={styles.pinLabel}>Enter UPI PIN</Text>
                <Text style={styles.pinAmt}><RupeeSymbol />{amount}</Text>
              </View>

              {/* Dots */}
              <View style={styles.pinDotsContainer}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
                ))}
              </View>
            </View>

            {/* Numpad */}
            <View style={styles.numpad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity key={num} style={styles.numKey} onPress={() => handlePinPress(num.toString())}>
                  <Text style={styles.numKeyText}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.numKey} onPress={() => handlePinPress("backspace")}>
                <Ionicons name="backspace-outline" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.numKey} onPress={() => handlePinPress("0")}>
                <Text style={styles.numKeyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.numKey, { backgroundColor: '#4285F4' }]} onPress={handlePinSubmit}>
                <Ionicons name="checkmark" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : processing ? (
          // Processing State

          <View style={styles.processingContainer}>
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png",
              }}
              style={styles.gpayLogo}
              resizeMode="contain"
            />
            <ActivityIndicator
              size="large"
              color="#4285F4"
              style={styles.loader}
            />
            <Text style={styles.processingText}>Processing Payment...</Text>
            <Text style={styles.amountText}>
              <RupeeSymbol />
              {amount}
            </Text>
            <Text style={styles.warningText}>
              Do not press back or close the app
            </Text>
          </View>
        ) : paymentSuccess ? (
          // Success State with Animation
          <View style={styles.successContainer}>
            <Animated.View
              style={[
                styles.successIconContainer,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={100} color="#22c55e" />
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim, width: "100%" }}>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successSubtitle}>
                Your payment has been processed successfully
              </Text>

              {/* Transaction Details Card */}
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={[styles.detailValue, styles.txnId]}>
                    {transactionId}
                  </Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <View style={styles.paymentMethodRow}>
                    <Image
                      source={{
                        uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png",
                      }}
                      style={styles.smallGpayLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.detailValue}>Google Pay</Text>
                  </View>
                </View>
                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount Paid</Text>
                  <Text style={[styles.detailValue, styles.amountPaid]}>
                    <RupeeSymbol />
                    {amount}
                  </Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <View>
                    <Text style={styles.detailValue}>{new Date().toLocaleDateString()}</Text>
                    <Text style={styles.detailValueSmall}>{new Date().toLocaleTimeString()}</Text>
                  </View>
                </View>
                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.statusBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#15803d"
                    />
                    <Text style={styles.statusText}>Success</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>View Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => router.replace("/(tabs)/home")}
              >
                <Text style={styles.homeButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          // Initial Payment Screen
          <View style={styles.initialContainer}>
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png",
              }}
              style={styles.gpayLogo}
              resizeMode="contain"
            />

            {/* Bill Details Card */}
            <View style={styles.billDetailsCard}>
              <Text style={styles.billDetailsTitle}>Bill Details</Text>

              {(() => {
                try {
                  const orderData = params.orderData
                    ? JSON.parse(params.orderData)
                    : null;
                  const billDetails = orderData?.billDetails;

                  if (billDetails) {
                    return (
                      <>
                        <View style={styles.billRow}>
                          <Text style={styles.billLabel}>Item Total</Text>
                          <Text style={styles.billValue}>
                            <Text
                              style={{
                                fontFamily: Platform.select({
                                  ios: "Arial",
                                  android: "sans-serif",
                                  default: "sans-serif",
                                }),
                                fontWeight: "normal",
                              }}
                            >
                              {"\u20B9"}
                            </Text>
                            {billDetails.itemTotal}
                          </Text>
                        </View>

                        <View style={styles.billRow}>
                          <Text style={styles.billLabel}>GST (5%)</Text>
                          <Text style={styles.billValue}>
                            <Text
                              style={{
                                fontFamily: Platform.select({
                                  ios: "Arial",
                                  android: "sans-serif",
                                  default: "sans-serif",
                                }),
                                fontWeight: "normal",
                              }}
                            >
                              {"\u20B9"}
                            </Text>
                            {billDetails.taxes}
                          </Text>
                        </View>

                        <View style={styles.billRow}>
                          <Text style={styles.billLabel}>Delivery Fee</Text>
                          <Text style={styles.billValue}>
                            <Text
                              style={{
                                fontFamily: Platform.select({
                                  ios: "Arial",
                                  android: "sans-serif",
                                  default: "sans-serif",
                                }),
                                fontWeight: "normal",
                              }}
                            >
                              {"\u20B9"}
                            </Text>
                            {billDetails.deliveryFee}
                          </Text>
                        </View>

                        {billDetails.discount > 0 && (
                          <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Discount</Text>
                            <Text
                              style={[styles.billValue, styles.discountText]}
                            >
                              -
                              <Text
                                style={{
                                  fontFamily: Platform.select({
                                    ios: "Arial",
                                    android: "sans-serif",
                                    default: "sans-serif",
                                  }),
                                  fontWeight: "normal",
                                }}
                              >
                                {"\u20B9"}
                              </Text>
                              {billDetails.discount}
                            </Text>
                          </View>
                        )}

                        <View style={styles.billDivider} />

                        <View style={styles.billRow}>
                          <Text style={styles.billTotalLabel}>
                            Total Amount
                          </Text>
                          <Text style={styles.billTotalValue}>
                            <RupeeSymbol />
                            {amount}
                          </Text>
                        </View>
                      </>
                    );
                  }
                } catch (error) {
                  console.error("Error parsing bill details:", error);
                }

                return (
                  <View style={styles.billRow}>
                    <Text style={styles.billTotalLabel}>Amount to Pay</Text>
                    <Text style={styles.billTotalValue}>
                      <RupeeSymbol />
                      {amount}
                    </Text>
                  </View>
                );
              })()}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.payButton}
                onPress={handlePayClick}
                activeOpacity={0.7}
              >
                <Text style={styles.payButtonText}>
                  Pay <RupeeSymbol />
                  {amount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButtonAlt}
                onPress={handleCancelPayment}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonAltText}>Cancel</Text>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  initialContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  billDetailsCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: Platform.OS === "web" ? 24 : 20,
    marginTop: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  billDetailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  billLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  billValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  discountText: {
    color: "#22c55e",
  },
  billDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  billTotalLabel: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
  },
  billTotalValue: {
    fontSize: 20,
    color: "#4285F4",
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  payButton: {
    width: "100%",
    backgroundColor: "#4285F4",
    paddingVertical: Platform.OS === "web" ? 16 : 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  payButtonText: {
    color: "#fff",
    fontSize: Platform.OS === "web" ? 17 : 16,
    fontWeight: "bold",
  },
  cancelButtonAlt: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: Platform.OS === "web" ? 16 : 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  cancelButtonAltText: {
    color: "#6b7280",
    fontSize: Platform.OS === "web" ? 17 : 16,
    fontWeight: "600",
  },
  processingContainer: {
    alignItems: "center",
  },
  gpayLogo: {
    width: 120,
    height: 48,
    marginBottom: 40,
  },
  loader: {
    marginVertical: 20,
  },
  processingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  amountText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4285F4",
    marginTop: 8,
    marginBottom: 32,
  },
  warningText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  detailValueSmall: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "right",
    marginTop: 2,
  },
  txnId: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
    color: "#4285F4",
  },
  amountPaid: {
    fontSize: 16,
    color: "#22c55e",
    fontWeight: "bold",
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallGpayLogo: {
    width: 50,
    height: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#15803d",
    fontWeight: "bold",
  },
  doneButton: {
    width: "100%",
    backgroundColor: "#FC8019",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#FC8019",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  homeButton: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  homeButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  // PIN Screen Styles
  pinContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
  },
  pinHeader: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: 'center',
    marginBottom: 40,
  },
  pinHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  pinHeaderSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  pinBody: {
    alignItems: 'center',
    marginBottom: 60,
  },
  pinTopRow: {
    alignItems: 'center',
    marginBottom: 30,
  },
  pinLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginBottom: 8,
  },
  pinAmt: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  pinDotsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "transparent",
  },
  pinDotFilled: {
    backgroundColor: "#333",
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 'auto',
    backgroundColor: '#f8f9fa',
    paddingBottom: 20,
  },
  numKey: {
    width: '33%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numKeyText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },
});
