import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../context/ToastContext";
import {
  categories,
  foodOptions,
  restaurants, // [NEW] Mock Data
} from "../../data/mockData";
import { API_BASE_URL, SOCKET_URL } from "../../constants/api";
import { addToCart } from "../../store/slices/cartSlice";
import {
  fetchRestaurants,
  fetchGroceries,
  fetchFeaturedProducts,
  updateRestaurantStatus,
  selectDataLoading,
  selectRestaurants,
  selectGroceries,
  selectFeaturedProducts,
  selectCategories,
  fetchCategories
} from "../../store/slices/dataSlice";
import {
  selectLocation,
  selectLocationCoords,
  selectLocationType,
  selectUser,
} from "../../store/slices/userSlice";
import { io } from "socket.io-client";

const RESTAURANT_SOCKET_URL = SOCKET_URL;


const { width } = Dimensions.get("window");

// --- Interactive Components ---
const InteractiveCard = ({ children, onPress, style }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={style}
    >
      <Animated.View style={[animatedStyle, { width: '100%', height: '100%', alignItems: 'center' }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const SectionHeader = ({ title, subtitle, onScrollLeft, onScrollRight, canScrollLeft, canScrollRight }: any) => (
  <View style={styles.sectionHeaderContainer}>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {(onScrollLeft || onScrollRight) && (
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={[styles.navBtn, !canScrollLeft && styles.navBtnDisabled]}
          onPress={onScrollLeft}
          disabled={!canScrollLeft}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={canScrollLeft ? "#4b5563" : "#9ca3af"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, !canScrollRight && styles.navBtnDisabled]}
          onPress={onScrollRight}
          disabled={!canScrollRight}
        >
          <Ionicons
            name="arrow-forward"
            size={18}
            color={canScrollRight ? "#4b5563" : "#9ca3af"}
          />
        </TouchableOpacity>
      </View>
    )}
  </View>
);

// --- Mock Data ---
const SEARCH_ITEMS = [
  " 'Biryani'",
  " 'Grocery'",
  " 'Pizza'",
  " 'Milk'",
  " 'Cake'",
  " 'Thali'",
];

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const location = useSelector(selectLocation);
  const locationType = useSelector(selectLocationType);
  const { showToast } = useToast();

  const coords = useSelector(selectLocationCoords);
  const isDataLoading = useSelector(selectDataLoading);
  const nearbyRestaurants = useSelector(selectRestaurants); // USE REDUX DATA
  const groceryItems = useSelector(selectGroceries); // [NEW] Use fetched data
  const featuredProducts = useSelector(selectFeaturedProducts); // [NEW]
  const dbCategories = useSelector(selectCategories); // [NEW] Dynamic Categories

  // State
  // Filter State
  const [filterType, setFilterType] = useState("All"); // All, Veg, Non-Veg
  const [priceRange, setPriceRange] = useState("All"); // All, Low, Medium, High
  const [ratingFilter, setRatingFilter] = useState(0); // 0, 4.0, 4.5

  // State for search
  const [searchQuery, setSearchQuery] = useState("");

  // Banners State
  const [homeBanners, setHomeBanners] = useState([]);

  // FETCH DATA API
  useEffect(() => {
    // Fetch Banners
    const fetchBanners = async () => {
      try {
        const url = coords?.latitude && coords?.longitude
          ? `${API_BASE_URL}/external/banners?lat=${coords.latitude}&lon=${coords.longitude}`
          : `${API_BASE_URL}/external/banners`;

        const response = await fetch(url);
        const data = (await response.json()) as any[];
        setHomeBanners(data);
      } catch (err) {
        console.error("Banner fetch failed:", err);
      }
    };
    fetchBanners();

    if (!coords?.latitude || !coords?.longitude) return;
    console.log("Fetching home data for:", coords);
    const doFetch = () => {
      (dispatch as any)(
        fetchRestaurants({
          lat: coords.latitude,
          lon: coords.longitude,
        } as any)
      );
      (dispatch as any)(
        fetchGroceries({
          lat: coords.latitude,
          lon: coords.longitude,
        } as any)
      );
      (dispatch as any)(
        fetchFeaturedProducts({
          lat: coords.latitude,
          lon: coords.longitude,
        } as any)
      ); // [NEW] Fetch products near user
      (dispatch as any)(fetchCategories()); // [NEW] Fetch dynamic categories
    };
    doFetch();
    // Re-fetch whenever app comes back to foreground (catches isOpen/stock changes)
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") doFetch();
    });
    return () => sub.remove();
  }, [coords?.latitude, coords?.longitude, dispatch]);

  // Real-time socket: listen for restaurant open/close toggle
  useEffect(() => {
    const socket = io(RESTAURANT_SOCKET_URL);

    socket.on("connect", () => {
      console.log("🔌 Connected to Restaurant socket for real-time status");
    });

    socket.on("connect_error", (err) => {
      console.warn("❌ Restaurant socket error:", err.message);
    });

    socket.on("restaurantStatusChanged", ({ restaurantId, isOpen }) => {
      console.log(`📡 Restaurant ${restaurantId} isOpen=${isOpen}`);
      dispatch(updateRestaurantStatus({ restaurantId, isOpen }));
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);


  // Derived Data with Filters
  const filteredRestaurants = useMemo(() => {
    let result = nearbyRestaurants || [];

    // Filter by Rating
    if (ratingFilter > 0) {
      result = result.filter((r) => r.rating >= ratingFilter);
    }

    if (searchQuery) {
      // Search logic handled in searchResults below for global search
    }
    return result;
  }, [nearbyRestaurants, filterType, priceRange, ratingFilter]);

  const filteredProductsDisplay = useMemo(() => {
    let rawResult = featuredProducts || [];
    let result = [];
    const seenNames = new Set();
    for (const p of rawResult) {
      if (!seenNames.has(p.name)) {
        seenNames.add(p.name);
        result.push(p);
      }
    }

    // Filter by Type
    if (filterType === "Veg") {
      result = result.filter((p) => p.isVeg === true); // Note: schema uses isVeg boolean
    } else if (filterType === "Non-Veg") {
      // Schema uses isVeg=false for Non-Veg
      result = result.filter((p) => p.isVeg === false);
    }

    // Filter by Price
    if (priceRange === "Low") { // 0-100
      result = result.filter((p) => p.price < 100);
    } else if (priceRange === "Medium") { // 100-200
      result = result.filter((p) => p.price >= 100 && p.price <= 200);
    } else if (priceRange === "High") { // 200+
      result = result.filter((p) => p.price > 200);
    }

    // Filter by Rating
    if (ratingFilter > 0) {
      result = result.filter((p) => p.rating >= ratingFilter);
    }

    return result;
  }, [featuredProducts, filterType, priceRange, ratingFilter]);

  // Use dynamic categories with fallback to mock
  const displayCategories = useMemo(() => {
    return dbCategories && dbCategories.length > 0 ? dbCategories : categories;
  }, [dbCategories]);

  // Update Search Results with useMemo
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();

    // Filter Restaurants
    const filteredRestaurants = (nearbyRestaurants || [])
      .filter((r) => r.name.toLowerCase().includes(query))
      .map((r) => ({ type: "Restaurant", data: r }));
    // Filter Categories
    const filteredCategories = displayCategories
      .filter((c) => c.name.toLowerCase().includes(query))
      .map((c) => ({ type: "Category", data: c }));
    // Filter Food Options
    const filteredFood = foodOptions
      .filter((f) => f.name.toLowerCase().includes(query))
      .map((f) => ({ type: "Food", data: f }));
    // Filter Products
    const filteredProducts = (featuredProducts || [])
      .filter((p) => p.name.toLowerCase().includes(query))
      .map((p) => ({ type: "Product", data: p }));

    return [
      ...filteredRestaurants,
      ...filteredCategories,
      ...filteredFood,
      ...filteredProducts,
      // ...groceryItems.map(g => ({ type: "Grocery", data: g })) // Optional
    ];
  }, [searchQuery, nearbyRestaurants, featuredProducts]);


  // Handle restaurant click - save to MongoDB first
  const handleRestaurantClick = async (restaurant) => {
    try {
      // Check if it's already a MongoDB ID (24 hex chars)
      // The backend 'getNearbyData' maps _id -> id
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(restaurant.id);

      if (restaurant._id || isMongoId) {
        router.push({
          pathname: "/restaurant/[id]",
          params: { id: restaurant._id || restaurant.id },
        });
        return;
      }

      // Use centralized API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/restaurants/save-external`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: restaurant.id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          address: {
            street: restaurant.address,
            city: restaurant.location,
            coordinates: {
              lat: restaurant.lat,
              lon: restaurant.lon,
            },
          },
          image: restaurant.image,
          time: restaurant.time,
          price: restaurant.price,
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        throw new Error(data.message || "Failed to save restaurant");
      }

      // Navigate with MongoDB ID
      router.push({
        pathname: "/restaurant/[id]",
        params: { id: data._id },
      });
    } catch (error: any) {
      console.error("Error saving restaurant:", error);
      showToast(error.message || "Error loading restaurant", "error");
    }
  };

  // Helper for image source
  const getImageSource = (img) => {
    if (typeof img === "string") return { uri: img };
    return img;
  };

  // Banner Click Handler
  const handleBannerClick = async (banner) => {
    console.log("Banner clicked:", banner.title, "LinkType:", banner.linkType, "LinkId:", banner.linkId);

    // Record click for analytics
    try {
      // Await fetch to ensure it sends before the component unmounts for navigation
      await fetch(`${API_BASE_URL}/external/banners/click/${banner._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error("Click record fail:", err);
    }

    if (!banner.linkType || banner.linkType.toLowerCase() === "none") return;

    const type = banner.linkType.toLowerCase();
    const id = banner.linkId;

    if (!id) return;

    if (type === "restaurant") {
      router.push({
        pathname: "/restaurant/[id]",
        params: { id: id },
      });
    } else if (type === "category") {
      router.push({
        pathname: "/collection/[id]",
        params: { id: id },
      });
    } else if (type === "web") {
      // In a real app, use Linking.openURL
      console.log("Opening web link:", id);
    }
  };

  // Banner Carousel Component
  const BannerCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const carouselRef = useRef(null);

    // Adjusted Width logic to match styles
    const bannerWidth = Platform.OS === 'web' ? (width > 1200 ? 1168 : width - 40) : width - 32;

    useEffect(() => {
      if (homeBanners.length <= 1) return;

      const interval = setInterval(() => {
        setActiveIndex((prev) => {
          const nextIndex = (prev + 1) % homeBanners.length;
          carouselRef.current?.scrollTo({ x: nextIndex * bannerWidth, animated: true });
          return nextIndex;
        });
      }, 4000); // Slightly faster sliding (4s)

      return () => clearInterval(interval);
    }, [homeBanners.length, bannerWidth]);

    if (homeBanners.length === 0) return null;

    return (
      <View style={[styles.bannerWrapper, Platform.OS === 'web' && { alignSelf: 'center' }]}>
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
            setActiveIndex(index);
          }}
          contentContainerStyle={{ gap: 0 }}
        >
          {homeBanners.map((banner) => (
            <TouchableOpacity
              key={banner._id}
              activeOpacity={0.9}
              onPress={() => handleBannerClick(banner)}
              style={styles.bannerItem}
            >
              <Image
                source={{ uri: banner.image }}
                style={styles.bannerImg}
                resizeMode="cover"
              />
              {/* Discount Badge */}
              {banner.discountType && banner.discountType !== 'none' && (
                <View style={[styles.discountBadge, { top: 10, left: 10, borderBottomRightRadius: 6, borderTopLeftRadius: 6, borderBottomLeftRadius: 0, borderTopRightRadius: 0, backgroundColor: '#FC8019' }]}>
                  <Text style={styles.discountText}>
                    {banner.discountType === 'percentage' ? `${banner.discountValue}% OFF` :
                      banner.discountType === 'flat' ? `₹${banner.discountValue} OFF` : 'FREE ITEM'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        {homeBanners.length > 1 && (
          <View style={styles.pagination}>
            {homeBanners.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, activeIndex === i && styles.activeDot]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  // Scroll refs and state for navigation buttons
  const foodScrollRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const restaurantScrollRef = useRef(null);
  const productScrollRef = useRef(null);

  const [foodCanScrollLeft, setFoodCanScrollLeft] = useState(false);
  const [foodCanScrollRight, setFoodCanScrollRight] = useState(true);
  const [categoryCanScrollLeft, setCategoryCanScrollLeft] = useState(false);
  const [categoryCanScrollRight, setCategoryCanScrollRight] = useState(true);
  const [restaurantCanScrollLeft, setRestaurantCanScrollLeft] = useState(false);
  const [restaurantCanScrollRight, setRestaurantCanScrollRight] =
    useState(true);
  const [productCanScrollLeft, setProductCanScrollLeft] = useState(false);
  const [productCanScrollRight, setProductCanScrollRight] = useState(true);

  const foodContentWidth = useRef(0);
  const foodLayoutWidth = useRef(0);
  const foodScrollX = useRef(0);

  const categoryContentWidth = useRef(0);
  const categoryLayoutWidth = useRef(0);
  const categoryScrollX = useRef(0);

  const restaurantContentWidth = useRef(0);
  const restaurantLayoutWidth = useRef(0);
  const restaurantScrollX = useRef(0);

  const productContentWidth = useRef(0);
  const productLayoutWidth = useRef(0);
  const productScrollX = useRef(0);

  // Scroll handlers
  const handleFoodScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    foodScrollX.current = x;
    setFoodCanScrollLeft(x > 5);
    if (foodContentWidth.current > 0 && foodLayoutWidth.current > 0) {
      const isAtEnd =
        x + foodLayoutWidth.current >= foodContentWidth.current - 5;
      setFoodCanScrollRight(!isAtEnd);
    }
  };

  const handleCategoryScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    categoryScrollX.current = x;
    setCategoryCanScrollLeft(x > 5);
    if (categoryContentWidth.current > 0 && categoryLayoutWidth.current > 0) {
      const isAtEnd =
        x + categoryLayoutWidth.current >= categoryContentWidth.current - 5;
      setCategoryCanScrollRight(!isAtEnd);
    }
  };

  const handleRestaurantScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    restaurantScrollX.current = x;
    setRestaurantCanScrollLeft(x > 5);
    if (
      restaurantContentWidth.current > 0 &&
      restaurantLayoutWidth.current > 0
    ) {
      const isAtEnd =
        x + restaurantLayoutWidth.current >= restaurantContentWidth.current - 5;
      setRestaurantCanScrollRight(!isAtEnd);
    }
  };

  const handleProductScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    productScrollX.current = x;
    setProductCanScrollLeft(x > 5);
    if (productContentWidth.current > 0 && productLayoutWidth.current > 0) {
      const isAtEnd =
        x + productLayoutWidth.current >= productContentWidth.current - 5;
      setProductCanScrollRight(!isAtEnd);
    }
  };

  // Scroll functions
  const scrollFood = (direction) => {
    if (foodScrollRef.current) {
      const scrollAmount = width * 0.8;
      const newX =
        direction === "left"
          ? Math.max(0, foodScrollX.current - scrollAmount)
          : foodScrollX.current + scrollAmount;
      foodScrollRef.current.scrollTo({ x: newX, animated: true });
    }
  };

  const scrollCategory = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = width * 0.8;
      const newX =
        direction === "left"
          ? Math.max(0, categoryScrollX.current - scrollAmount)
          : categoryScrollX.current + scrollAmount;
      categoryScrollRef.current.scrollTo({ x: newX, animated: true });
    }
  };

  const scrollRestaurant = (direction) => {
    if (restaurantScrollRef.current) {
      const scrollAmount = width * 0.8;
      const newX =
        direction === "left"
          ? Math.max(0, restaurantScrollX.current - scrollAmount)
          : restaurantScrollX.current + scrollAmount;
      restaurantScrollRef.current.scrollTo({ x: newX, animated: true });
    }
  };

  const scrollProduct = (direction) => {
    if (productScrollRef.current) {
      const scrollAmount = width * 0.8;
      const newX =
        direction === "left"
          ? Math.max(0, productScrollX.current - scrollAmount)
          : productScrollX.current + scrollAmount;
      productScrollRef.current.scrollTo({ x: newX, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.contentContainer, Platform.OS === 'web' && { width: '100%' }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.addressRow}
              onPress={() => router.push("/profile/addresses")}
            >
              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={
                      locationType === "Work" ? "briefcase" :
                        locationType === "Other" ? "location" : "home"
                    }
                    size={20}
                    color="#FC8019"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{ fontSize: 18, fontWeight: "bold", color: "#333" }}
                  >
                    {locationType || "Home"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="#333"
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <Text style={styles.locationSubtitle} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push("/profile")}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#FFF7ED",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#FFEDD5",
              }}
            >
              <Ionicons name="person" size={20} color="#FC8019" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for 'Biryani', 'Pizza'..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchRightIcons}>
              <Ionicons name="search" size={22} color="#FC8019" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={{ backgroundColor: '#fff', paddingBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            <TouchableOpacity
              onPress={() => setFilterType(filterType === "Veg" ? "All" : "Veg")}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                borderColor: filterType === "Veg" ? "#008000" : "#e0e0e0",
                backgroundColor: filterType === "Veg" ? "#e6ffe6" : "#fff"
              }}
            >
              <Text style={{ color: filterType === "Veg" ? "#008000" : "#333", fontWeight: "600" }}>Pure Veg 🟢</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterType(filterType === "Non-Veg" ? "All" : "Non-Veg")}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                borderColor: filterType === "Non-Veg" ? "#D32F2F" : "#e0e0e0",
                backgroundColor: filterType === "Non-Veg" ? "#ffebee" : "#fff"
              }}
            >
              <Text style={{ color: filterType === "Non-Veg" ? "#D32F2F" : "#333", fontWeight: "600" }}>Non-Veg 🔴</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPriceRange(priceRange === "Low" ? "All" : "Low")}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                borderColor: priceRange === "Low" ? "#FC8019" : "#e0e0e0",
                backgroundColor: priceRange === "Low" ? "#FFF7ED" : "#fff"
              }}
            >
              <Text style={{ color: priceRange === "Low" ? "#FC8019" : "#333", fontWeight: "600" }}>Under ₹100</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPriceRange(priceRange === "Medium" ? "All" : "Medium")}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                borderColor: priceRange === "Medium" ? "#FC8019" : "#e0e0e0",
                backgroundColor: priceRange === "Medium" ? "#FFF7ED" : "#fff"
              }}
            >
              <Text style={{ color: priceRange === "Medium" ? "#FC8019" : "#333", fontWeight: "600" }}>₹100 - ₹200</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPriceRange(priceRange === "High" ? "All" : "High")}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                borderColor: priceRange === "High" ? "#FC8019" : "#e0e0e0",
                backgroundColor: priceRange === "High" ? "#FFF7ED" : "#fff"
              }}
            >
              <Text style={{ color: priceRange === "High" ? "#FC8019" : "#333", fontWeight: "600" }}>₹200+</Text>
            </TouchableOpacity>

            {/* Rating Filter Chips */}
            <TouchableOpacity
              onPress={() => setRatingFilter(ratingFilter === 4.0 ? 0 : 4.0)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                borderColor: ratingFilter === 4.0 ? "#FC8019" : "#e0e0e0",
                backgroundColor: ratingFilter === 4.0 ? "#FFF7ED" : "#fff",
                flexDirection: 'row', alignItems: 'center'
              }}
            >
              <Text style={{ color: ratingFilter === 4.0 ? "#FC8019" : "#333", fontWeight: "600" }}>4.0+ </Text>
              <Ionicons name="star" size={14} color={ratingFilter === 4.0 ? "#FC8019" : "#FFC107"} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRatingFilter(ratingFilter === 4.5 ? 0 : 4.5)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                borderColor: ratingFilter === 4.5 ? "#FC8019" : "#e0e0e0",
                backgroundColor: ratingFilter === 4.5 ? "#FFF7ED" : "#fff",
                flexDirection: 'row', alignItems: 'center'
              }}
            >
              <Text style={{ color: ratingFilter === 4.5 ? "#FC8019" : "#333", fontWeight: "600" }}>4.5+ </Text>
              <Ionicons name="star" size={14} color={ratingFilter === 4.5 ? "#FC8019" : "#FFC107"} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {searchQuery.length > 0 ? (
            // SEARCH RESULTS VIEW
            <View style={styles.searchResultsContainer}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {searchResults.length === 0 ? (
                <Text style={styles.noResultsText}>
                  No results found for "{searchQuery}"
                </Text>
              ) : (
                searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => {
                      if (item.type === "Food" || item.type === "Category") {
                        router.push({
                          pathname: "/collection/[id]",
                          params: { id: item.data.name },
                        });
                      } else if (item.type === "Restaurant") {
                        handleRestaurantClick(item.data);
                      } else if (item.type === "Product") {
                        router.push({
                          pathname: "/product/[id]",
                          params: {
                            id: item.data._id || item.data.id || item.data.name,
                            name: item.data.name,
                            price: item.data.price,
                            image: item.data.image,
                            description: item.data.description,
                            isVeg: item.data.isVeg ?? item.data.veg,
                            restaurantId: item.data.restaurantId || item.data.restaurant,
                            restaurantName: item.data.restaurantName,
                          },
                        });
                      }
                    }}
                  >
                    <View style={styles.resultIconContainer}>
                      {item.type === "Restaurant" && (
                        <Ionicons name="restaurant" size={20} color="#666" />
                      )}
                      {item.type === "Category" && (
                        <Ionicons name="grid" size={20} color="#666" />
                      )}
                      {item.type === "Food" && (
                        <Image
                          source={getImageSource(item.data.image)}
                          style={{ width: 30, height: 30, borderRadius: 15 }}
                        />
                      )}
                      {item.type === "Product" && (
                        <Ionicons name="cart" size={20} color="#666" />
                      )}
                    </View>
                    <View>
                      <Text style={styles.resultName}>{item.data.name}</Text>
                      <Text style={styles.resultType}>{item.type}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            // STANDARD DASHBOARD VIEW
            <>
              {/* Promotional Banners */}
              <BannerCarousel />

              {/* What's on your mind? (Categories) - only show when no type filter active */}
              {filterType === "All" && (
                <View style={styles.section}>
                  <SectionHeader
                    title="What's on your mind?"
                    onScrollLeft={() => scrollCategory("left")}
                    onScrollRight={() => scrollCategory("right")}
                    canScrollLeft={categoryCanScrollLeft}
                    canScrollRight={categoryCanScrollRight}
                  />
                  <ScrollView
                    ref={categoryScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    onScroll={handleCategoryScroll}
                    scrollEventThrottle={16}
                    onContentSizeChange={(w) => {
                      categoryContentWidth.current = w;
                    }}
                    onLayout={(e) => {
                      categoryLayoutWidth.current = e.nativeEvent.layout.width;
                    }}
                  >
                    {displayCategories.map((item, index) => (
                      <InteractiveCard
                        key={item._id || index}
                        style={styles.categoryItem}
                        onPress={() =>
                          router.push({
                            pathname: "/collection/[id]",
                            params: { id: item.name },
                          })
                        }
                      >
                        <View style={styles.categoryImageContainer}>
                          <Image
                            source={getImageSource(item.image)}
                            style={styles.categoryImage}
                            resizeMode="cover"
                          />
                        </View>
                        <Text style={styles.categoryLabel} numberOfLines={2}>
                          {item.name}
                        </Text>
                      </InteractiveCard>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Best Food Options - Using Real Featured Products */}
              {(filteredProductsDisplay.length > 0) && (
                <View style={styles.section}>
                  <SectionHeader
                    title="Order our best food options"
                    onScrollLeft={() => scrollFood("left")}
                    onScrollRight={() => scrollFood("right")}
                    canScrollLeft={foodCanScrollLeft}
                    canScrollRight={foodCanScrollRight}
                  />
                  <ScrollView
                    ref={foodScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.horizontalList,
                      Platform.OS === "web" && styles.webHorizontalScroll,
                    ]}
                    onScroll={handleFoodScroll}
                    scrollEventThrottle={16}
                    onContentSizeChange={(w) => {
                      foodContentWidth.current = w;
                    }}
                    onLayout={(e) => {
                      foodLayoutWidth.current = e.nativeEvent.layout.width;
                    }}
                  >
                    {filteredProductsDisplay.map((item) => (
                      <InteractiveCard
                        key={item._id}
                        style={Platform.OS === 'web' ? styles.webItemValues : styles.foodItem}
                        onPress={() =>
                          router.push({
                            pathname: "/product/[id]",
                            params: {
                              id: item._id,
                              name: item.name,
                              price: item.price,
                              image: item.image,
                              description: item.description,
                              category: item.category,
                              isVeg: item.isVeg,
                              restaurantId: item.restaurant?._id || item.restaurant, // Pass restaurantId
                              restaurantName: item.restaurant?.name || "Restaurant",
                              restaurantIsOpen: item.restaurant?.isOpen
                            },
                          })
                        }
                      >
                        <View style={Platform.OS === 'web' ? { position: 'relative', width: '100%', height: 180, overflow: 'hidden', borderRadius: 16 } : styles.foodImageContainer}>
                          <Image
                            source={getImageSource(item.image)}
                            style={Platform.OS === 'web' ? styles.webFoodImage : styles.foodOptionImage}
                            resizeMode="cover"
                          />
                          {(item.isBestSeller || item.isMustTry) && (
                            <View style={styles.webBestSellerBadge}>
                              <Ionicons name="star" size={10} color="#fff" style={{ marginRight: 4 }} />
                              <Text style={styles.webBestSellerText}>
                                {item.isBestSeller ? "BESTSELLER" : "MUST TRY"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={Platform.OS === 'web' ? styles.webItemText : styles.itemLabel} numberOfLines={2}>{item.name}</Text>
                        <Text style={Platform.OS === 'web' ? [styles.webRestMeta, { textAlign: 'center' }] : { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' }} numberOfLines={1}>
                          {item.restaurant?.name}
                        </Text>
                      </InteractiveCard>
                    ))}
                  </ScrollView>
                  {Platform.OS === "web" && (
                    <View style={styles.webSectionDivider} />
                  )}
                </View>
              )}

              {/* Near By Grocery - Hidden when Non-Veg filter is active or grocery items are empty */}
              {filterType !== "Non-Veg" && groceryItems && groceryItems.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="Near By Grocery" />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.horizontalList,
                      Platform.OS === "web" && styles.webHorizontalScroll,
                    ]}
                  >
                    {groceryItems.map((item) => (
                      <InteractiveCard
                        key={item.id}
                        style={Platform.OS === 'web' ? styles.webGroceryCard : {
                          marginRight: 16,
                          width: 140,
                          backgroundColor: '#fff',
                          borderRadius: 12,
                          overflow: 'hidden',
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                          marginBottom: 8,
                        }}
                        onPress={() => router.push({
                          pathname: "/grocery/[id]",
                          params: {
                            id: item.id,
                            name: item.name,
                            address: item.address,
                            rating: item.rating,
                            time: item.time,
                            image: item.image,
                            isLocal: item.isLocal ? "true" : "false"
                          }
                        })}
                      >
                        <Image
                          source={{ uri: item.image }}
                          style={Platform.OS === 'web' ? styles.webGroceryImage : {
                            width: '100%',
                            height: 100,
                            resizeMode: 'cover',
                            backgroundColor: '#f8f8f8'
                          }}
                        />
                        <View style={Platform.OS === 'web' ? styles.webRestInfo : { padding: 8 }}>
                          <Text style={Platform.OS === 'web' ? styles.webRestName : {
                            fontSize: 14,
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: 2
                          }} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={Platform.OS === 'web' ? styles.webRestMeta : {
                            fontSize: 12,
                            color: '#6b7280'
                          }}>
                            {item.time || "20-30 min"}
                          </Text>
                        </View>
                      </InteractiveCard>
                    ))}
                  </ScrollView>

                  {Platform.OS === "web" && (
                    <View style={styles.webSectionDivider} />
                  )}
                </View>
              )}

              {/* Suggested Products (NEW) */}
              <View style={styles.section}>
                <SectionHeader
                  title="Suggested Products"
                  onScrollLeft={() => scrollProduct("left")}
                  onScrollRight={() => scrollProduct("right")}
                  canScrollLeft={productCanScrollLeft}
                  canScrollRight={productCanScrollRight}
                />
                <ScrollView
                  ref={productScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.horizontalList,
                    Platform.OS === "web" && styles.webHorizontalScroll,
                  ]}
                  onScroll={handleProductScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={(w) => {
                    productContentWidth.current = w;
                  }}
                  onLayout={(e) => {
                    productLayoutWidth.current = e.nativeEvent.layout.width;
                  }}
                >
                  {filteredProductsDisplay.map((item, index) => (
                    <InteractiveCard
                      key={index}
                      style={
                        Platform.OS === "web"
                          ? styles.webProductCard
                          : styles.productCard
                      }
                      onPress={() =>
                        router.push({
                          pathname: "/product/[id]",
                          params: {
                            id: item._id, // Use _id for real products
                            name: item.name,
                            price: item.price,
                            image: item.image,
                            description: item.description,
                            category: item.category,
                            isVeg: item.isVeg,
                            restaurantId: item.restaurant?._id || item.restaurant,
                            restaurantName: item.restaurant?.name || "Restaurant",
                            restaurantIsOpen: item.restaurant?.isOpen
                          },
                        })
                      }
                    >
                      {/* Discount Badge */}
                      {Platform.OS !== "web" && item.originalPrice && item.originalPrice > item.price && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>
                            {Math.round(
                              ((item.originalPrice - item.price) /
                                item.originalPrice) *
                              100
                            )}
                            % OFF
                          </Text>
                        </View>
                      )}

                      <View
                        style={
                          Platform.OS === "web"
                            ? styles.webProductImageContainer
                            : undefined
                        }
                      >
                        <Image
                          source={getImageSource(item.image)}
                          style={
                            Platform.OS === "web"
                              ? styles.webProductImage
                              : [styles.productImage, { resizeMode: 'cover' }]
                          }
                          resizeMode="cover"
                        />
                        {Platform.OS === "web" && (
                          <TouchableOpacity
                            style={styles.webAddButton}
                            onPress={(e) => {
                              if (Platform.OS === "web") e.stopPropagation();
                              if (!user.phone) {
                                router.push("/auth/login");
                              } else {
                                dispatch(
                                  addToCart({
                                    id: item._id || item.name,
                                    name: item.name,
                                    price: item.price,
                                    quantity: 1,
                                    image: item.image,
                                    veg: item.isVeg,
                                    restaurantId: item.restaurant?._id || item.restaurant,
                                    restaurantName: item.restaurant?.name || "Restaurant",
                                  })
                                );
                                showToast("Added to cart");
                              }
                            }}
                          >
                            <Text style={styles.webAddButtonText}>ADD</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View
                        style={
                          Platform.OS === "web"
                            ? styles.webProductInfo
                            : styles.productInfo
                        }
                      >
                        <Text
                          style={
                            Platform.OS === "web"
                              ? styles.webProductName
                              : styles.productName
                          }
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={
                            Platform.OS === "web"
                              ? styles.webProductQty
                              : styles.productQty
                          }
                        >
                          {item.quantity}
                        </Text>
                        <View
                          style={
                            Platform.OS === "web"
                              ? styles.webProductPriceRow
                              : styles.priceRow
                          }
                        >
                          <Text
                            style={
                              Platform.OS === "web"
                                ? styles.webProductPrice
                                : styles.currentPrice
                            }
                          >
                            {"\u20B9"}
                            {item.price}
                          </Text>
                        </View>
                        {Platform.OS !== "web" && (
                          <TouchableOpacity
                            style={styles.addButton}
                            onPress={(e) => {
                              if (Platform.OS === "web") e.stopPropagation();
                              if (!user.phone) {
                                router.push("/auth/login");
                              } else {
                                dispatch(
                                  addToCart({
                                    id: item._id || item.name,
                                    name: item.name,
                                    price: item.price,
                                    quantity: 1,
                                    image: item.image,
                                    veg: item.isVeg,
                                    restaurantId: item.restaurant?._id || item.restaurant,
                                    restaurantName: item.restaurant?.name || "Restaurant",
                                  })
                                );
                                showToast("Added to cart");
                              }
                            }}
                          >
                            <Text style={styles.addButtonText}>ADD</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </InteractiveCard>
                  ))}
                </ScrollView>
              </View>
              {/* RESTAURANTS SECTION - Always visible regardless of filter */}
              {nearbyRestaurants && nearbyRestaurants.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title="Discover best restaurants"
                    onScrollLeft={() => scrollRestaurant("left")}
                    onScrollRight={() => scrollRestaurant("right")}
                    canScrollLeft={restaurantCanScrollLeft}
                    canScrollRight={restaurantCanScrollRight}
                  />
                  <ScrollView
                    ref={restaurantScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    onScroll={handleRestaurantScroll}
                    scrollEventThrottle={16}
                    onContentSizeChange={(w) => {
                      restaurantContentWidth.current = w;
                    }}
                    onLayout={(e) => {
                      restaurantLayoutWidth.current = e.nativeEvent.layout.width;
                    }}
                  >
                    {isDataLoading && (!nearbyRestaurants || nearbyRestaurants.length === 0) ? (
                      <View style={{ paddingHorizontal: 16, width: width - 32 }}>
                        <Text style={{ color: "#6b7280" }}>
                          Loading nearby restaurants…
                        </Text>
                      </View>
                    ) : filteredRestaurants.length === 0 ? (
                      <View style={{ paddingHorizontal: 16, width: width - 32 }}>
                        <Text style={{ color: "#6b7280" }}>
                          No restaurants match your filters.
                        </Text>
                      </View>
                    ) : filteredRestaurants.map((item) =>
                      Platform.OS === "web" ? (
                        <InteractiveCard
                          key={item.id}
                          style={styles.webRestCard}
                          onPress={() => handleRestaurantClick(item)}
                        >
                          <Image
                            source={getImageSource(item.image)}
                            style={styles.webRestImage}
                            resizeMode="cover"
                          />
                          <View style={styles.webRestInfo}>
                            <Text style={styles.webRestName}>{item.name}</Text>
                            <Text style={styles.webRestMeta}>
                              {item.rating} • {item.time}
                            </Text>
                            <Text style={styles.webRestCuisine}>
                              {item.cuisine}
                            </Text>
                            <Text style={styles.webDiscountText}>
                              {item.discount}
                            </Text>
                          </View>
                        </InteractiveCard>
                      ) : (
                        <InteractiveCard
                          key={item.id || item._id}
                          style={[styles.restaurantCard, item.isOpen === false && { opacity: 0.75 }]}
                          onPress={() => handleRestaurantClick(item)}
                        >
                          <View style={styles.restImageContainer}>
                            <Image
                              source={getImageSource(item.image)}
                              style={styles.restImage}
                              resizeMode="cover"
                            />
                            {item.isOpen === false ? (
                              <View style={styles.restClosedOverlay}>
                                <Text style={styles.restClosedOverlayText}>CLOSED</Text>
                                <Text style={styles.restClosedOverlaySub}>Not accepting orders</Text>
                              </View>
                            ) : (
                              <>
                                <View style={styles.promotedTag}>
                                  <Text style={styles.promotedText}>Promoted</Text>
                                </View>
                                <View style={styles.restDiscountBadge}>
                                  <Text style={styles.restDiscountText}>
                                    {item.discount}
                                  </Text>
                                </View>
                              </>
                            )}
                            <View style={styles.bookmarkIcon}>
                              <Ionicons
                                name="bookmark-outline"
                                size={20}
                                color="#fff"
                              />
                            </View>
                          </View>
                          <View style={styles.restInfo}>
                            <View style={styles.restHeader}>
                              <Text style={[styles.restName, item.isOpen === false && { color: '#999' }]} numberOfLines={1}>
                                {item.name}
                              </Text>
                              {item.isOpen === false ? (
                                <View style={styles.restClosedChip}>
                                  <Text style={styles.restClosedChipText}>Closed</Text>
                                </View>
                              ) : (
                                <View style={styles.ratingBadge}>
                                  <Text style={styles.ratingVal}>{item.rating}</Text>
                                  <Ionicons name="star" size={10} color="#fff" style={{ marginLeft: 2 }} />
                                </View>
                              )}
                            </View>
                            <View style={styles.restMetaRow}>
                              <Text style={styles.cuisineText} numberOfLines={1}>
                                {item.cuisine}
                              </Text>
                              <Text style={styles.priceText}>
                                {item.priceForTwo || item.price}
                              </Text>
                            </View>
                            <View style={styles.restLocationRow}>
                              <Ionicons name="location-outline" size={14} color="#9ca3af" />
                              <Text style={styles.locationText} numberOfLines={1}>
                                {(item.location || item.address)} • {item.time}
                              </Text>
                            </View>
                            {item.isOpen !== false && (
                              <View style={styles.bookingRow}>
                                <Ionicons name="calendar-outline" size={14} color="#059669" />
                                <Text style={styles.bookingText}>Table booking available</Text>
                              </View>
                            )}
                          </View>
                        </InteractiveCard>
                      )
                    )}
                  </ScrollView>
                  {Platform.OS === "web" && (
                    <View style={styles.webSectionDivider} />
                  )}
                </View>
              )}
              {/* Promo Banner Example */}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee",
    marginRight: 10,
    backgroundColor: "#fff",
  },
  locTypeActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  locTypeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  locTypeTextActive: {
    color: "#fff",
  },
  locationIcon: {
    fontSize: 18,
    color: "#FC8019",
    marginRight: 5,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  arrowIcon: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  locationSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    maxWidth: 250,
    marginLeft: 26, // Align with text (Icon 20 + Margin 6)
  },
  profileBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  profileEmoji: {
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: "#666",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    height: "100%",
    paddingLeft: 0,
    zIndex: 2,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      } as any,
    }),
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 45,
    zIndex: 1,
  },
  placeholderText: {
    fontSize: 15,
    color: "#666",
  },
  animatedTextContainer: {
    height: 30,
    justifyContent: "center",
    overflow: "hidden",
  },
  dynamicText: {
    color: "#333",
    fontWeight: "600",
  },
  searchRightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  micIcon: {
    fontSize: 18,
    color: "#FC8019",
    marginLeft: 10,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: Platform.OS === "web" ? 20 : 0,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Platform.OS === "web" ? 22 : 18,
    fontWeight: "900",
    color: "#282C3F",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  navButtons: {
    flexDirection: "row",
    gap: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F3",
    justifyContent: "center",
    alignItems: "center",
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  // Food Items (Circular)
  foodItem: {
    alignItems: "center",
    width: 85,
    marginRight: 20
  },
  foodImageContainer: {
    width: 75,
    height: 75,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0,0,0,0.06)'
      }
    })
  },
  foodOptionImage: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
    resizeMode: "cover"
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3d4152",
    textAlign: "center",
    height: 34,
  },

  // Consistently named styles (removes duplicates)
  restaurantCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: "#fff",
    // No visible border, just clean layout
    borderRadius: 16,
  },
  restImageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  restImage: { width: "100%", height: "100%" },
  promotedTag: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promotedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  bookmarkIcon: { position: "absolute", top: 12, right: 12 },
  restDiscountBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  restDiscountText: { color: "#2563eb", fontSize: 11, fontWeight: "700" },

  restInfo: { paddingHorizontal: 4 },
  restHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  restName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingVal: { color: "#fff", fontSize: 12, fontWeight: "700" },

  restMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cuisineText: { color: "#6b7280", fontSize: 13, flex: 1 },
  priceText: { color: "#6b7280", fontSize: 13 },

  restLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: { color: "#9ca3af", fontSize: 12, marginLeft: 4, flex: 1 },

  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bookingText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 6,
  },

  // UPDATED CATEGORY STYLES
  categoryItem: {
    alignItems: "center",
    width: Platform.OS === "web" ? 250 : 80,
    marginRight: Platform.OS === "web" ? 24 : 20,
  },
  categoryImageContainer: {
    width: Platform.OS === "web" ? 250 : 75,
    height: Platform.OS === "web" ? 180 : 75,
    borderRadius: Platform.OS === "web" ? 16 : 38,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 4px 15px rgba(0,0,0,0.05)",
      }
    }),
  },
  categoryImage: { width: "100%", height: "100%", resizeMode: 'cover' },
  categoryLabel: {
    fontSize: Platform.OS === "web" ? 16 : 11,
    fontWeight: "700",
    color: "#3d4152",
    textAlign: "center",
    lineHeight: 14,
    height: 28,
  },

  // PRODUCT CARD STYLES
  productCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
    marginRight: 10,
    position: "relative",
    // Shadow
    // Shadow
    ...Platform.select({
      web: { boxShadow: "0px 2px 4px rgba(0,0,0,0.05)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  discountBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#3b82f6",
    borderTopLeftRadius: 15,
    borderBottomRightRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  discountText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  productImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  productInfo: { alignItems: "flex-start" },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
    height: 36,
  },
  productQty: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  currentPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginRight: 6,
  },
  oldPrice: {
    fontSize: 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  addButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FC8019",
    borderRadius: 8,
    paddingVertical: 6,
    width: "100%",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FC8019",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  promoBanner: {
    margin: 16,
    marginTop: 32,
    backgroundColor: "#FC8019",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  promoText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  promoTextSub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  saveBtn: {
    backgroundColor: "#FC8019",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Search Results Styles
  searchResultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  resultType: {
    fontSize: 12,
    color: "#999",
  },
  // WEB STYLES (Copied from index.tsx for consistency)
  webSectionDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 20,
    width: "100%",
  },
  // Banner Styles
  bannerWrapper: {
    marginVertical: 16,
    marginHorizontal: Platform.OS === 'web' ? 'auto' : 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: Platform.OS === 'web' ? 400 : 200,
    width: Platform.OS === 'web' ? (width > 1200 ? 1168 : width - 40) : width - 32,
    backgroundColor: '#f3f4f6',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerItem: {
    width: Platform.OS === 'web' ? (width > 1200 ? 1168 : width - 40) : width - 32,
    height: Platform.OS === 'web' ? 400 : 200,
  },
  bannerImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#fff',
  },
  webHorizontalScroll: {
    paddingBottom: 20,
    marginBottom: 40,
  },
  webItemValues: {
    alignItems: "center",
    width: 250, // [BIGGER] Matched to restaurant card width
    marginRight: 24,
  },
  webFoodImage: {
    width: 250, // [BIGGER] Matched to restaurant card width
    height: 180, // More cinematic aspect ratio
    borderRadius: 16,
    marginBottom: 12,
  },
  webItemText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: 'center',
  },
  webRestCard: {
    width: 250,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    marginRight: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 15px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease-in-out"
      }
    }),
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  webRestImage: {
    width: "100%",
    height: 180,
  },
  webRestInfo: {
    padding: 16,
  },
  webRestName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  webRestMeta: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  webRestCuisine: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
  },
  webDiscountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B54909",
    marginTop: 4,
  },

  // Web Grocery Card
  webGroceryCard: {
    width: 250,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    marginRight: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 15px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease-in-out"
      }
    }),
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  webGroceryImage: {
    width: "100%",
    height: 180,
  },

  // Web Product Card
  webProductCard: {
    width: 250,
    marginRight: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "#f3f4f6",
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 15px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease-in-out"
      },
    }),
  },
  webProductImageContainer: {
    width: "100%",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 0,
    marginBottom: 0,
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  webProductImage: {
    width: "100%",
    height: "100%",
  },
  webAddButton: {
    position: "absolute",
    bottom: -15,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
    ...Platform.select({
      web: { boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
    borderWidth: 1,
    borderColor: "#d4d5d9",
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  webAddButtonText: {
    color: "#1BA672",
    fontWeight: "bold",
    fontSize: 14,
  },
  webProductInfo: {
    marginTop: 15,
    paddingHorizontal: 4,
  },
  webProductName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3e4152",
    marginBottom: 4,
    height: 36,
  },
  webProductQty: {
    fontSize: 12,
    color: "#9fa3af",
    marginBottom: 4,
  },
  webProductPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  webProductPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3e4152",
  },
  webProductDiscount: {
    fontSize: 12,
    color: "#9fa3af",
    textDecorationLine: "line-through",
  },
  restClosedOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.52)",
    justifyContent: "center",
    alignItems: "center",
  },
  restClosedOverlayText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  restClosedOverlaySub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 4,
  },
  restClosedChip: {
    backgroundColor: "#f44336",
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  restClosedChipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  webBestSellerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backdropFilter: 'blur(4px)',
  },
  webBestSellerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
