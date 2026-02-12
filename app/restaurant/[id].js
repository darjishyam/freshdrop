import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { VegNonVegIcon } from "../../components/VegNonVegIcon";
import { useToast } from "../../context/ToastContext";
import { restaurantItems, restaurants, getRestaurantMenu } from "../../data/mockData";
import { addToCart } from "../../store/slices/cartSlice";
import { loadReviews, selectReviews } from "../../store/slices/reviewsSlice";

import { selectUser } from "../../store/slices/userSlice";
import { API_BASE_URL } from "../../constants/api";

export default function RestaurantScreen() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const reviews = useSelector(selectReviews);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const restaurantId = typeof id === "string" ? id : "";

  // State for API data
  const [restaurant, setRestaurant] = React.useState(null);
  const [menuItems, setMenuItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Filter state
  const [filterMode, setFilterMode] = React.useState("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);

  // Default menu items (shown when no products in database)
  const defaultMenuItems = [
    {
      id: "default-1",
      name: "Paneer Butter Masala",
      price: 280,
      description: "Cottage cheese cooked in rich tomato gravy with butter and cream",
      veg: true,
      bestSeller: true,
      image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80",
      weight: "Serves 2",
    },
    {
      id: "default-2",
      name: "Chicken Biryani",
      price: 320,
      description: "Aromatic basmati rice layered with tender chicken and spices",
      veg: false,
      bestSeller: true,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80",
      weight: "Serves 2",
    },
    {
      id: "default-3",
      name: "Margherita Pizza",
      price: 250,
      description: "Classic pizza with fresh mozzarella, tomatoes, and basil",
      veg: true,
      bestSeller: false,
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80",
      weight: "Medium",
    },
    {
      id: "default-4",
      name: "Butter Chicken",
      price: 300,
      description: "Tender chicken in creamy tomato-based curry",
      veg: false,
      bestSeller: true,
      image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&q=80",
      weight: "Serves 2",
    },
    {
      id: "default-5",
      name: "Veg Fried Rice",
      price: 180,
      description: "Stir-fried rice with mixed vegetables and soy sauce",
      veg: true,
      bestSeller: false,
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=80",
      weight: "Serves 1",
    },
    {
      id: "default-6",
      name: "Masala Dosa",
      price: 120,
      description: "Crispy rice crepe filled with spiced potato filling",
      veg: true,
      bestSeller: true,
      image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&q=80",
      weight: "1 Piece",
    },
  ];

  // Fetch restaurant data from API
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) return;

      try {
        setLoading(true);
        console.log("Fetching restaurant details for ID:", restaurantId);

        // Check if it's a valid MongoDB ObjectId (24 hex chars)
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(restaurantId);

        if (isMongoId) {
          // Fetch from Backend
          const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`);
          const data = await response.json();

          if (response.ok) {
            // Transform data to match UI expectations if needed
            // Backend returns: { _id, name, ... products: [] }
            setRestaurant(data);
            // If backend provides products, use them. Else fallback to defaults or empty.
            // The controller getRestaurantById should return products.
            const hasProducts = data.products && Array.isArray(data.products) && data.products.length > 0;
            setMenuItems(hasProducts ? data.products : defaultMenuItems);
          } else {
            throw new Error(data.message || "Failed to fetch restaurant");
          }
        } else {
          // Fallback for Mock IDs
          console.log("Using Mock Data for ID:", restaurantId);
          let mockRestaurant = restaurants.find(r => r.id === restaurantId);
          if (!mockRestaurant) mockRestaurant = restaurants[0];

          const mockMenu = getRestaurantMenu(mockRestaurant.id);
          setRestaurant(mockRestaurant);
          setMenuItems(mockMenu.length > 0 ? mockMenu : defaultMenuItems);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching restaurant:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      // Keep trying to load reviews, though it might fail if ID is mismatch
      // Or we could mock reviews too? modifying reviewsSlice is out of scope for now.
      dispatch(loadReviews(restaurantId));
    }
  }, [dispatch, restaurantId]);

  // Calculate real rating from user reviews
  const calculatedRating = useMemo(() => {
    if (reviews.length === 0) {
      return restaurant?.rating || "New"; // Fallback to mock rating if no reviews
    }
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);
    return avgRating;
  }, [reviews, restaurant]);

  // Use useMemo for filtered items performance
  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Apply veg/non-veg filter
    switch (filterMode) {
      case "VEG":
        items = items.filter((item) => item.veg === true);
        break;
      case "NON_VEG":
        items = items.filter((item) => item.veg === false);
        break;
      default:
        items = menuItems;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [filterMode, menuItems, searchQuery]);

  // ALL HOOKS MUST BE ABOVE THIS LINE - NOW we can do early returns
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FC8019" />
          <Text style={{ marginTop: 10 }}>Loading restaurant...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            {error || "Restaurant not found"}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }) => (
    <Pressable
      style={styles.itemCard}
      onPress={() =>
        router.push({ pathname: "/product/[id]", params: { id: item.name } })
      }
    >
      <View style={styles.itemInfo}>
        <View style={styles.classifierRow}>
          <VegNonVegIcon veg={item.veg} size={16} />
          {item.bestSeller && (
            <Text style={styles.bestSellerTag}>Bestseller</Text>
          )}
        </View>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>
          <FontAwesome name="rupee" size={13} color="#333" /> {item.price}
        </Text>
        <Text style={styles.itemDesc} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.itemImageContainer}>
        <Image
          source={
            typeof item.image === "string" ? { uri: item.image } : item.image
          }
          style={styles.itemImage}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            if (!user.phone) {
              router.push("/auth/login");
              return;
            }

            // Debug: Check what we're sending
            console.log("Restaurant object:", restaurant);
            console.log("Restaurant ID:", restaurant?._id);
            console.log("Restaurant Name:", restaurant?.name);

            // Use restaurant._id if available, otherwise use restaurantId from URL
            const validRestaurantId = restaurant?.id || restaurant?._id || restaurantId;

            dispatch(
              addToCart({
                id: item._id || item.id, // Use _id if available (backend product), else mock id
                name: item.name,
                price: item.price,
                quantity: 1,
                image: item.image,
                restaurantId: restaurant?._id || restaurant?.id || restaurantId, // Stronger Fallback
                restaurantName: restaurant?.name || "Unknown Restaurant",
                veg: item.veg,
                weight: item.weight,
                supplier: item.supplier,
              })
            );
            showToast(`${item.name} added to cart`);
          }}
        >
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView stickyHeaderIndices={[0]}>
        {/* Header Back Button Overlay */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={styles.roundBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.roundBtn}
            onPress={() => {
              setShowSearch(!showSearch);
              if (showSearch) {
                setSearchQuery("");
              }
            }}
          >
            <Ionicons
              name={showSearch ? "close" : "search"}
              size={24}
              color="#000"
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for dishes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.restHeaderContainer}>
          <Text style={styles.restName}>{restaurant.name}</Text>
          <View style={styles.restMeta}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.ratingTextWhite}>{calculatedRating}</Text>
            </View>
            <Text style={styles.metaText}>
              {reviews.length > 0 && `(${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'})`}
              {" "}• {restaurant.time} • {restaurant.priceForTwo}
            </Text>
          </View>
          <Text style={styles.cuisineText}>{restaurant.cuisine}</Text>
          <Text style={styles.locationText}>{restaurant.location}</Text>

          <View style={styles.dashedDivider} />

          <View style={styles.offerRow}>
            <Ionicons
              name="pricetag"
              size={16}
              color="#2563eb"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.offerText}>{restaurant.discount}</Text>
          </View>

          {/* Veg/Non-Veg Filters */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                filterMode === "VEG" && styles.filterBtnActiveVeg,
              ]}
              onPress={() =>
                setFilterMode(filterMode === "VEG" ? "ALL" : "VEG")
              }
            >
              <Text
                style={[
                  styles.filterBtnText,
                  filterMode === "VEG" && styles.filterBtnTextActiveVeg,
                ]}
              >
                VEG
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                filterMode === "NON_VEG" && styles.filterBtnActiveNonVeg,
              ]}
              onPress={() =>
                setFilterMode(filterMode === "NON_VEG" ? "ALL" : "NON_VEG")
              }
            >
              <Text
                style={[
                  styles.filterBtnText,
                  filterMode === "NON_VEG" && styles.filterBtnTextActiveNonVeg,
                ]}
              >
                NON-VEG
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.menuTitle}>Recommended</Text>

        <View style={styles.menuList}>
          {filteredItems.map((item) => (
            <React.Fragment key={item.id}>
              {renderItem({ item })}
              <View style={styles.separator} />
            </React.Fragment>
          ))}
          {filteredItems.length === 0 && (
            <Text style={styles.emptyText}>No items match your filter.</Text>
          )}
        </View>

        <View style={styles.dashedDivider} />

        {/* Reviews Section */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.menuTitle}>Ratings & Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text>
          ) : (
            reviews.map((review) => (
              <View key={review._id || review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>{review.userName}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingTextWhite}>{review.rating} ★</Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  heroImage: {
    width: "100%",
    height: 250,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerOverlay: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff", // Sticky header bg
    zIndex: 10,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    outlineStyle: "none",
  },
  restHeaderContainer: {
    padding: 16,
    paddingHorizontal: Platform.OS === "android" ? 20 : 16,
    backgroundColor: "#fff",
    borderBottomWidth: 8,
    borderBottomColor: "#f3f4f6",
  },
  restName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  restMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingPill: {
    flexDirection: "row",
    backgroundColor: "#22c55e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: "center",
    marginRight: 8,
  },
  ratingTextWhite: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 2,
  },
  metaText: {
    color: "#4b5563",
    fontSize: 14,
  },
  cuisineText: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 2,
  },
  locationText: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 12,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    marginBottom: 12,
  },
  offerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  offerText: {
    color: "#4b5563",
    fontWeight: "600",
    fontSize: 13,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "800",
    padding: 16,
    paddingHorizontal: Platform.OS === "android" ? 20 : 16,
    paddingBottom: 0,
    color: "#1f2937",
  },
  menuList: {
    padding: 16,
    paddingHorizontal: Platform.OS === "android" ? 20 : 16,
  },
  // Item Card (Reused styles roughly)
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  classifierRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  bestSellerTag: {
    fontSize: 10,
    color: "#ff6600",
    backgroundColor: "#fff5e6",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    fontWeight: "600",
  },
  itemName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: "#4b5563",
    marginLeft: 4,
    fontWeight: "600",
  },
  itemDesc: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 6,
  },
  restaurantNameSmall: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FC8019",
    fontStyle: "italic",
    marginTop: 4,
  },
  itemImageContainer: {
    width: 130,
    height: 130, // Square image
    position: "relative",
    borderRadius: 12,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  addButton: {
    position: "absolute",
    bottom: -10, // Hanging off the bottom
    left: "15%",
    width: "70%",
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#22c55e",
    fontWeight: "800",
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    marginBottom: 10,
  },
  backBtn: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f4f4f5",
    borderRadius: 8,
  },
  backBtnText: {
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
  filterRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
  },
  // Active States
  filterBtnActiveVeg: {
    backgroundColor: "#dcfce7", // Light green
    borderColor: "#22c55e",
  },
  filterBtnTextActiveVeg: {
    color: "#15803d", // Dark green
  },
  filterBtnActiveNonVeg: {
    backgroundColor: "#fee2e2", // Light red
    borderColor: "#ef4444",
  },
  filterBtnTextActiveNonVeg: {
    color: "#b91c1c", // Dark red
  },
  reviewsContainer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#fff",
    marginBottom: 40,
  },
  noReviewsText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 10,
    fontStyle: "italic",
  },
  reviewCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  ratingBadge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
});
