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

export default function PhonePePaymentScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const params = useLocalSearchParams();

  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [showPin, setShowPin] = useState(false); // [MODIFIED] Start with Details screen
  const [pin, setPin] = useState("");
  const timerRef = useRef(null);
  const redirectTimerRef = useRef(null);

  // Handle Pay button click - SHOW PIN SCREEN FIRST
  const handlePayClick = useCallback(() => {
    setShowPin(true);
  }, []);

  const handleCancelPayment = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    showToast("Payment cancelled");
    router.back();
  }, [router, showToast]);

  // Animation values for success screen
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Amount
  const amount = params.amount
    ? Math.round(parseFloat(params.amount)).toString()
    : "0";

  // Generate Transaction ID
  const generateTransactionId = useCallback(() => {
    // T + random digits
    const randomRef = "T" + Math.floor(Math.random() * 1000000000000000)
      .toString()
      .substring(0, 20);
    return randomRef;
  }, []);

  // Handle PIN Submit
  const handlePinSubmit = useCallback(() => {
    if (pin.length !== 4) {
      showToast("Please enter 4-digit UPI PIN");
      return;
    }
    setShowPin(false);
    startProcessing();
  }, [pin]);

  const handlePinPress = (digit) => {
    if (digit === "backspace") {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const startProcessing = useCallback(async () => {
    console.log("PIN Verified! Starting Payment...");

    setProcessing(true);
    const txnId = generateTransactionId();
    setTransactionId(txnId);

    // Simulate payment processing (4 seconds)
    timerRef.current = setTimeout(async () => {
      setProcessing(false);
      setPaymentSuccess(true);

      try {
        const orderData = params.orderData
          ? JSON.parse(params.orderData)
          : null;
        if (orderData) {
          const orderPayload = {
            ...orderData,
            transactionId: txnId,
            paymentMethod: "UPI (PhonePe)",
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
        // Auto-redirect after delay
        redirectTimerRef.current = setTimeout(() => {
          showToast("Payment Successful! Redirecting...");
          handleDone();
        }, 1500);
      });
    }, 3000);
  }, [amount, generateTransactionId, scaleAnim, fadeAnim, params, dispatch, showToast]);

  const handleDone = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    router.replace({ pathname: "/orders", params: { fromPayment: "true" } });
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        {showPin ? (
          // PIN ENTRY SCREEN (PhonePe Style - Purple)
          <View style={styles.pinContainer}>
            {/* Header */}
            <View style={styles.pinHeader}>
              <View style={styles.headerRow}>
                <Text style={styles.pinHeaderTitle}>PhonePe</Text>
                <Image
                  source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" }}
                  style={{ width: 24, height: 24, marginLeft: 8 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.pinHeaderSubtitle}>USER@ybl</Text>
            </View>

            <View style={styles.pinBody}>
              <View style={styles.pinTopRow}>
                <Text style={styles.pinLabel}>Enter UPI PIN</Text>
                <Text style={styles.pinAmt}><RupeeSymbol />{amount}</Text>
              </View>

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
              <TouchableOpacity style={[styles.numKey, { backgroundColor: '#5f259f' }]} onPress={handlePinSubmit}>
                <Ionicons name="checkmark" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : processing ? (
          // Processing State
          <View style={styles.processingContainer}>
            <Image
              source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" }}
              style={styles.logo} // 100x100
              resizeMode="contain"
            />
            <ActivityIndicator
              size="large"
              color="#5f259f"
              style={styles.loader}
            />
            <Text style={styles.processingText}>Processing request...</Text>
            <Text style={styles.amountText}>
              <RupeeSymbol />
              {amount}
            </Text>
          </View>
        ) : paymentSuccess ? (
          // Success State
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

            <Animated.View style={{ opacity: fadeAnim, width: "100%", alignItems: 'center' }}>
              <Text style={styles.successTitle}>Payment Successful</Text>

              <View style={styles.detailsCard}>
                <Text style={styles.paidText}>Paid to Merchant</Text>
                <Text style={styles.amountPaid}><RupeeSymbol />{amount}</Text>

                <View style={[styles.divider, { marginVertical: 16 }]} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>{transactionId}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          // Initial Payment Screen (Bill Details)
          <View style={styles.initialContainer}>
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png",
              }}
              style={styles.logo}
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
                            <RupeeSymbol />
                            {billDetails.itemTotal}
                          </Text>
                        </View>

                        <View style={styles.billRow}>
                          <Text style={styles.billLabel}>GST (5%)</Text>
                          <Text style={styles.billValue}>
                            <RupeeSymbol />
                            {billDetails.taxes}
                          </Text>
                        </View>

                        <View style={styles.billRow}>
                          <Text style={styles.billLabel}>Delivery Fee</Text>
                          <Text style={styles.billValue}>
                            <RupeeSymbol />
                            {billDetails.deliveryFee}
                          </Text>
                        </View>

                        {billDetails.discount > 0 && (
                          <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Discount</Text>
                            <Text
                              style={[styles.billValue, styles.discountText]}
                            >
                              - <RupeeSymbol />
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // PIN Styles
  pinContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'space-between'
  },
  pinHeader: {
    padding: 16,
    backgroundColor: '#5f259f', // PhonePe Purple
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  pinHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  pinHeaderSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14
  },
  pinBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50
  },
  pinTopRow: {
    alignItems: 'center',
    marginBottom: 30
  },
  pinLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8
  },
  pinAmt: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000'
  },
  pinDotsContainer: {
    flexDirection: 'row',
    gap: 16
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: 'transparent'
  },
  pinDotFilled: {
    backgroundColor: '#333'
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
  },
  numKey: {
    width: '33.33%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#f0f0f0'
  },
  numKeyText: {
    fontSize: 24,
    color: '#333'
  },

  // Processing
  processingContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20
  },
  loader: {
    marginBottom: 20
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  amountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333'
  },
  warningText: {
    marginTop: 20,
    color: '#999',
    fontSize: 12
  },

  // Success
  successContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff'
  },
  successIconContainer: {
    marginBottom: 20
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center'
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center'
  },
  paidText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  amountPaid: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333'
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '100%'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  detailLabel: {
    color: '#666',
    fontSize: 14
  },
  detailValue: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14
  },
  doneButton: {
    backgroundColor: '#5f259f',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  // Initial Screen Styles
  initialContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    padding: 24,
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
    color: "#5f259f",
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  payButton: {
    width: "100%",
    backgroundColor: "#5f259f",
    paddingVertical: Platform.OS === "web" ? 16 : 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#5f259f",
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
});
