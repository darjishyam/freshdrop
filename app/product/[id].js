import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { VegNonVegIcon } from "../../components/VegNonVegIcon";
import WebLoginModal from "../../components/WebLoginModal";
import { useToast } from "../../context/ToastContext";
import { products, restaurantItems } from "../../data/mockData";
import { addToCart, selectCartItems } from "../../store/slices/cartSlice";
import { selectStock } from "../../store/slices/stockSlice";
import { selectUser } from "../../store/slices/userSlice";
import { loadReviews, selectProductReviews } from "../../store/slices/reviewsSlice";

const { width, height } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";

export default function ProductDetailsScreen() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { id, name, price, image, description, category, cuisine } =
    useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const cartItems = useSelector(selectCartItems);
  const [quantity, setQuantity] = useState(1);
  const [showWebLogin, setShowWebLogin] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  // Find product in all lists
  let product = null;
  const searchId = typeof id === "string" ? id.trim() : "";

  // 1. Try to find by direct Name/ID match in Global Data (Best for Local Assets)
  if (searchId) {
    // Direct name match
    product = products.find(
      (p) => p.name.toLowerCase() === searchId.toLowerCase()
    );

    // If not, checked restaurant items
    if (!product) {
      Object.values(restaurantItems).forEach((list) => {
        if (product) return;
        const found = list.find(
          (i) =>
            i.name.toLowerCase() === searchId.toLowerCase() ||
            (i.id && i.id.toString() === searchId)
        );
        if (found) product = found;
      });
    }

    // Legacy category fallback - strict avoid index 0
    if (!product) {
      product = products.find((p) => p.category === searchId);
    }
  }

  // 2. If NOT found in global data, use Navigation Params (For Dummy/Dynamic Items)
  if (!product && (name || image)) {
    product = {
      name: name,
      price: price,
      image: image,
      description: description,
      category: category || cuisine,
    };
  }

  // Debug: Check product data
  // useEffect(() => {
  //   if (product) {
  //     console.log("[DEBUG ProductPage] Product:", JSON.stringify({ id: product.id, name: product.name, restaurantId: product.restaurantId }));
  //   }
  // }, [product]);

  // Get real reviews from Redux for this specific product
  const reviews = useSelector((state) =>
    selectProductReviews(state, {
      id: product?.id,
      name: product?.name
    })
  );

  // Calculate average rating from real reviews
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return product?.rating || 4.2;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews, product]);

  // Load reviews when component mounts or product changes
  useEffect(() => {
    // Use the actual restaurantId or the fallback generic ID
    const targetRestaurantId = product?.restaurantId || "000000000000000000000001";
    dispatch(loadReviews(targetRestaurantId));
  }, [dispatch, product?.restaurantId]);

  // Stock Logic
  const currentStock = useSelector((state) =>
    selectStock(state, product?.id || product?.name)
  );

  // Calculate availability based on Cart + Stock (Check ID or Name match)
  const cartQty =
    cartItems.find((i) => i.id === product?.id || i.name === product?.name)
      ?.quantity || 0;
  const availableStock = Math.max(0, currentStock - cartQty);
  const isOutOfStock = availableStock <= 0;

  // Get Related Items with useMemo (Strict Category Match)
  const relatedItems = useMemo(() => {
    const targetCategory = product?.category || category;
    if (!targetCategory) return [];

    return products
      .filter((p) => p.category === targetCategory && p.name !== product?.name)
      .slice(0, 4); // Exact 4 items
  }, [product, category]);

  const handleAddToCart = () => {
    if (!user.phone) {
      router.push("/auth/login");
      return;
    }

    dispatch(
      addToCart({
        id: product.id || product.name,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image: product.image,
        veg: product.veg,
        weight: product.weight,
        supplier: product.supplier,
        restaurantName: product.restaurantName,
      })
    );
    showToast("Added to cart");
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Product not found: "{id}"</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, position: "relative" }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >


          <View
            style={[styles.imageContainer, IS_WEB && styles.webImageContainer]}
          >
            <Image
              source={
                typeof product.image === "string"
                  ? { uri: product.image }
                  : product.image
              }
              style={styles.productImage}
              resizeMode="contain"
            />
          </View>

          {/* Product Info */}
          <View
            style={[styles.infoContainer, IS_WEB && styles.webInfoContainer]}
          >
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <VegNonVegIcon veg={product.veg} size={18} />
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                </View>
                {product.restaurantName && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Ionicons name="restaurant" size={14} color="#FC8019" />
                    <Text style={styles.restaurantName}>
                      {product.restaurantName}
                    </Text>
                  </View>
                )}
                {/* Rating Display */}
                <View style={styles.ratingContainer}>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={12} color="#fff" />
                    <Text style={styles.ratingTextWhite}>
                      {averageRating}
                    </Text>
                  </View>
                  {reviews.length > 0 && (
                    <Text style={styles.ratingCount}>({reviews.length} reviews)</Text>
                  )}
                </View>
                <Text style={styles.productCategory}>
                  {product.category || product.cuisine || "Food"}
                </Text>
              </View>
              <Text style={styles.price}>
                {"\u20B9"}
                {product.price}
              </Text>
            </View>

            {/* Weight, Supplier, and Stock Badges */}
            <View style={styles.badgesRow}>
              {product.weight && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{product.weight}</Text>
                </View>
              )}
              {product.supplier &&
                product.supplier !== product.restaurantName && (
                  <View style={[styles.badge, styles.supplierBadge]}>
                    <Text style={[styles.badgeText, styles.supplierText]}>
                      By {product.supplier}
                    </Text>
                  </View>
                )}
              {/* Stock Badge */}
              {/* Stock Badge */}
              <View
                style={[
                  styles.badge,
                  isOutOfStock ? styles.outOfStockBadge : styles.inStockBadge,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  },
                ]}
              >
                <Ionicons
                  name={isOutOfStock ? "close-circle" : "checkmark-circle"}
                  size={14}
                  color="#fff"
                />
                <Text
                  style={[
                    styles.badgeText,
                    isOutOfStock ? styles.outOfStockText : styles.inStockText,
                    { marginLeft: 0 },
                  ]}
                >
                  {isOutOfStock ? "Out of Stock" : "In Stock"}
                </Text>
              </View>
            </View>

            <Text style={styles.description}>
              {product.description ||
                "Delicious and fresh, delivered to your doorstep."}
            </Text>

            {/* Quantity & Add */}
            <View style={styles.actionRow}>
              <View
                style={[styles.qtyContainer, isOutOfStock && { opacity: 0.5 }]}
              >
                <TouchableOpacity
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  style={styles.qtyBtn}
                  disabled={isOutOfStock}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity
                  onPress={() => setQuantity(quantity + 1)}
                  style={styles.qtyBtn}
                  disabled={isOutOfStock || quantity >= availableStock} // Limit to available stock
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.addToCartBtn,
                  (isOutOfStock || quantity > availableStock) &&
                  styles.disabledBtn,
                ]}
                onPress={handleAddToCart}
                disabled={isOutOfStock || quantity > availableStock}
              >
                <Text style={styles.addToCartText}>
                  {isOutOfStock ? "Out of Stock" : "Add Item"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Customer Reviews Section */}
          <View
            style={[styles.reviewsContainer, IS_WEB && styles.webInfoContainer]}
          >
            <TouchableOpacity
              style={styles.reviewSectionHeader}
              onPress={() => setShowReviews(!showReviews)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>
                Customer Reviews ({reviews.length})
              </Text>
              <Ionicons
                name={showReviews ? "chevron-up" : "chevron-down"}
                size={24}
                color="#333"
              />
            </TouchableOpacity>

            {showReviews && (
              <View style={styles.reviewsList}>
                {reviews.length === 0 ? (
                  <View style={styles.noReviewsContainer}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                    <Text style={styles.noReviewsText}>No reviews yet</Text>
                    <Text style={styles.noReviewsSubtext}>Be the first to review this product!</Text>
                  </View>
                ) : (
                  reviews.map((review, index) => {
                    // Generate user initial and colors dynamically
                    const userName = review.userName || "Anonymous";
                    const initial = userName.charAt(0).toUpperCase();
                    const colors = [
                      { color: "#16a34a", bgColor: "#f0fdf4" },
                      { color: "#0284c7", bgColor: "#e0f2fe" },
                      { color: "#d946ef", bgColor: "#fdf4ff" },
                      { color: "#ea580c", bgColor: "#fff7ed" },
                      { color: "#dc2626", bgColor: "#fef2f2" },
                    ];
                    const colorScheme = colors[index % colors.length];

                    // Format date
                    const reviewDate = review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                      : "Recently";

                    return (
                      <View key={review._id || review.id || index} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                          <View style={styles.reviewerInfo}>
                            <View
                              style={[
                                styles.reviewerAvatar,
                                { backgroundColor: colorScheme.bgColor },
                              ]}
                            >
                              <Text
                                style={[styles.avatarText, { color: colorScheme.color }]}
                              >
                                {initial}
                              </Text>
                            </View>
                            <Text style={styles.reviewerName}>{userName}</Text>
                          </View>
                          <View
                            style={[
                              styles.reviewRating,
                              {
                                backgroundColor:
                                  review.rating >= 4 ? "#22c55e" : "#84cc16",
                              },
                            ]}
                          >
                            <Text style={styles.reviewRatingText}>
                              {review.rating.toFixed(1)}
                            </Text>
                            <Ionicons name="star" size={10} color="#fff" />
                          </View>
                        </View>
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                        <Text style={styles.reviewDate}>{reviewDate}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* Related Items */}
          {relatedItems.length > 0 && (
            <View
              style={[styles.relatedSection, IS_WEB && styles.webInfoContainer]}
            >
              <Text style={styles.relatedTitle}>You might also like</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedList}
              >
                {relatedItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.relatedCard}
                    onPress={() =>
                      router.push({
                        pathname: "/product/[id]",
                        params: { id: item.name },
                      })
                    }
                  >
                    <Image
                      source={
                        typeof item.image === "string"
                          ? { uri: item.image }
                          : item.image
                      }
                      style={styles.relatedImage}
                      resizeMode="contain"
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <VegNonVegIcon veg={item.veg} size={14} />
                      <Text style={styles.relatedName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    {item.restaurantName && (
                      <Text style={styles.relatedRestaurant} numberOfLines={1}>
                        {item.restaurantName}
                      </Text>
                    )}
                    <Text style={styles.relatedPrice}>
                      {"\u20B9"}
                      {item.price}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.miniAddBtn,
                        (cartItems.find(
                          (c) => c.id === item.id || c.name === item.name
                        )?.quantity || 0) >= 10 && { backgroundColor: "#ccc" },
                      ]}
                      disabled={
                        (cartItems.find(
                          (c) => c.id === item.id || c.name === item.name
                        )?.quantity || 0) >= 10
                      }
                      onPress={(e) => {
                        e.stopPropagation(); // Prevent card navigation
                        if (!user.phone) {
                          router.push("/auth/login");
                        } else {
                          dispatch(
                            addToCart({
                              id: item.id || item.name,
                              name: item.name,
                              price: item.price,
                              quantity: 1,
                              image: item.image,
                              veg: item.veg,
                              weight: item.weight,
                              supplier: item.supplier,
                              restaurantName: item.restaurantName,
                            })
                          );
                          showToast("Added to cart");
                        }
                      }}
                    >
                      <Text style={styles.miniAddText}>
                        {(cartItems.find(
                          (c) => c.id === item.id || c.name === item.name
                        )?.quantity || 0) >= 10
                          ? "MAX"
                          : "ADD"}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>
      {/* Web: Login Modal */}
      {IS_WEB && (
        <WebLoginModal
          visible={showWebLogin}
          onClose={() => setShowWebLogin(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
    fontFamily: "Poppins_600SemiBold",
  },
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  imageContainer: {
    width: "100%",
    height: 300,
    position: "relative",
    backgroundColor: "#f9f9f9",
  },
  webImageContainer: {
    height: IS_WEB ? Math.min(400, width * 0.5) : 400,
    width: IS_WEB ? Math.min(400, width * 0.5) : 400,
    maxWidth: "90%",
    alignSelf: "center",
    marginTop: 40,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 50,
  },
  infoContainer: {
    padding: 20,
    paddingHorizontal: Platform.OS === "android" ? 20 : 20,
    paddingTop: 30,
    borderTopLeftRadius: 30, // Rounded top for sheet effect
    borderTopRightRadius: 30,
    marginTop: -20, // Negative margin to overlap image slightly
    backgroundColor: "#fff",
  },
  webInfoContainer: {
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
    marginTop: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "Poppins_700Bold",
    marginLeft: 6,
    lineHeight: 28,
  },
  restaurantName: {
    fontSize: 14,
    color: "#FC8019",
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins_400Regular",
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "Poppins_600SemiBold",
  },
  description: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: "Poppins_400Regular",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  qtyBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "green",
  },
  qtyText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  addToCartBtn: {
    backgroundColor: "#FC8019",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#FC8019",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Poppins_600SemiBold",
  },
  relatedSection: {
    padding: 20,
    marginTop: 20,
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    fontFamily: "Poppins_700Bold",
  },
  relatedList: {
    paddingBottom: 20,
  },
  relatedCard: {
    width: 160,
    marginRight: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  relatedImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
  },
  relatedName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    marginLeft: 6,
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
  },
  relatedRestaurant: {
    fontSize: 11,
    color: "#FC8019",
    marginBottom: 4,
    fontStyle: "italic",
    fontFamily: "Poppins_500Medium",
  },
  relatedPrice: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    fontFamily: "Poppins_600SemiBold",
  },
  miniAddBtn: {
    borderWidth: 1,
    borderColor: "#FC8019",
    borderRadius: 4,
    alignItems: "center",
    paddingVertical: 4,
  },
  miniAddText: {
    fontSize: 12,
    color: "#FC8019",
    fontWeight: "bold",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    marginTop: 5,
  },
  badge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    color: "#555",
    fontFamily: "Poppins_500Medium",
  },
  supplierBadge: {
    backgroundColor: "#fff3e0", // Light orange for supplier
  },
  supplierText: {
    color: "#e65100", // Darker orange text
  },
  inStockBadge: {
    backgroundColor: "#16a34a", // Solid Green
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inStockText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  outOfStockBadge: {
    backgroundColor: "#ef4444", // Solid Red
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  outOfStockText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  disabledBtn: {
    backgroundColor: "#9ca3af",
    elevation: 0,
    shadowOpacity: 0,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: "row",
    backgroundColor: "#22c55e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: "center",
  },
  ratingTextWhite: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 2,
    fontFamily: "Poppins_600SemiBold",
  },
  ratingCount: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 6,
    fontFamily: "Poppins_400Regular",
  },
  reviewsContainer: {
    padding: 20,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "Poppins_700Bold",
  },
  reviewSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reviewsList: {
    marginTop: 8,
  },
  reviewCard: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#16a34a",
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Poppins_600SemiBold",
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#22c55e",
    borderRadius: 4,
    gap: 2,
  },
  reviewRatingText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  reviewComment: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: "Poppins_400Regular",
  },
  reviewDate: {
    fontSize: 11,
    color: "#9ca3af",
    fontFamily: "Poppins_400Regular",
  },
  noReviewsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  noReviewsSubtext: {
    fontSize: 13,
    color: "#d1d5db",
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
  },
});
