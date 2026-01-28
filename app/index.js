import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { VegNonVegIcon } from "../components/VegNonVegIcon";
import WebLoginModal from "../components/WebLoginModal";
import { useToast } from "../context/ToastContext";
import {
  categories,
  foodOptions,
  products,
  restaurantItems,
  restaurants,
} from "../data/mockData";
import { fetchGroceries, selectGroceries } from "../store/slices/dataSlice";
import { addToCart } from "../store/slices/cartSlice";
import { selectUser } from "../store/slices/userSlice";


const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";

const GUJARAT_CITIES = [
  "Ahmedabad",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Bhavnagar",
  "Jamnagar",
  "Junagadh",
  "Gandhinagar",
  "Anand",
  "Navsari",
  "Morbi",
  "Nadiad",
  "Surendranagar",
  "Bharuch",
  "Mehsana",
  "Bhuj",
  "Porbandar",
  "Palanpur",
  "Valsad",
  "Vapi",
  "Gondal",
  "Veraval",
  "Godhra",
  "Patan",
  "Kalol",
  "Dahod",
  "Botad",
  "Amreli",
  "Deesa",
  "Jetpur",
  "Dholka",
  "Dhandhuka",
  "Viramgam",
  "Sanand",
  "Bavla",
  "Mahuva",
  "Keshod",
  "Mangrol",
  "Una",
  "Visnagar",
  "Unjha",
  "Sidhpur",
  "Kadi",
  "Mansa",
  "Vijapur",
  "Modasa",
  "Himatnagar",
  "Idar",
  "Prantij",
  "Talod",
  "Bayad",
  "Lunawada",
  "Santrampur",
  "Halol",
  "Kalol (Panchmahal)",
  "Rajpipla",
  "Ankleshwar",
  "Vyara",
  "Bardoli",
  "Mandvi (Surat)",
  "Bilimora",
  "Chikhli",
  "Dharampur",
  "Ahwa",
  "Anjar",
  "Gandhidham",
  "Mandvi (Kutch)",
  "Mundra",
  "Nakhatrana",
  "Rapar",
  "Wankaner",
  "Tankara",
  "Halvad",
  "Limbdi",
  "Chotila",
  "Thangadh",
  "Dhrangadhra",
  "Khambhat",
  "Petlad",
  "Borsad",
  "Umreth",
  "Dakor",
  "Balasinor",
  "Kapadvanj",
  "Padra",
  "Karjan",
  "Dabhoi",
  "Savli",
  "Sinor",
  "Sankheda",
];

export default function UnifiedAuthScreen() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { width: windowWidth } = useWindowDimensions();
  const isMobileWeb = IS_WEB && windowWidth < 768;

  const [phoneNumber, setPhoneNumber] = useState("");
  const [showWebLogin, setShowWebLogin] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const groceryItems = useSelector(selectGroceries); // [GROCERY FEATURE - REDUX]

  // Fetch Groceries (Landing Page - use default or user location)
  useEffect(() => {
    // Default to Mumbai or user location
    const lat = 19.0760;
    const lon = 72.8777;
    dispatch(fetchGroceries({ lat, lon }));
  }, [dispatch]);

  // Auth Redirect
  useEffect(() => {
    if (user.phone) {
      router.replace("/(tabs)/home");
    } else if (!IS_WEB) {
      // Mobile users without login should go to proper login screen
      router.replace("/auth/login");
    }
  }, [user.phone]);

  // Debounce Effect - Reduced to 300ms for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay for better responsiveness

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search Autocomplete Logic
  useEffect(() => {
    if (searchQuery.length >= 1) {
      const lowerQ = searchQuery.toLowerCase();
      const suggestions = [];
      const seen = new Set();

      const addSuggestion = (type, name, data, id) => {
        const key = `${type}-${name}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({ type, name, data, id });
        }
      };

      // 1. Restaurants
      restaurants.forEach((r) => {
        if (r.name.toLowerCase().startsWith(lowerQ)) {
          addSuggestion("restaurant", r.name, r, r.id);
        }
      });

      // 2. Menu Items (from restaurantItems)
      Object.values(restaurantItems)
        .flat()
        .forEach((item) => {
          if (item.name.toLowerCase().startsWith(lowerQ)) {
            addSuggestion("dish", item.name, item, item.id);
          }
        });

      // 3. Handpicked Products
      products.forEach((p) => {
        if (p.name.toLowerCase().startsWith(lowerQ)) {
          addSuggestion("product", p.name, p, p.id);
        }
      });

      // 4. Categories
      Object.keys(restaurantItems).forEach((category) => {
        if (category.toLowerCase().startsWith(lowerQ)) {
          addSuggestion("category", category, null, category);
        }
      });
      categories.forEach((cat) => {
        if (cat.name.toLowerCase().startsWith(lowerQ)) {
          addSuggestion("category", cat.name, null, cat.name);
        }
      });

      setSearchSuggestions(suggestions.slice(0, 8));
      if (suggestions.length > 0) {
        setShowSearchSuggestions(true);
      }
    } else {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
  }, [searchQuery]);

  // Location State
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationInputRef = useRef(null);

  // Restaurant Filter State (veg/non-veg)
  const [restaurantVegFilter, setRestaurantVegFilter] = useState(null); // null = all, true = veg only, false = non-veg only

  // Derived state for Search
  const filteredRestaurants = restaurants.filter((r) => {
    // 0. Location Filtering
    if (locationQuery.length > 0) {
      const matchLocation = r.location
        .toLowerCase()
        .includes(locationQuery.toLowerCase());
      if (!matchLocation) return false;
    }

    // 0.5 Veg/Non-Veg Filtering
    if (restaurantVegFilter !== null) {
      const rItems = Object.values(restaurantItems)
        .flat()
        .filter((item) => item.restaurantId === r.id);
      const hasMatchingItems = rItems.some(
        (item) => item.veg === restaurantVegFilter
      );
      if (!hasMatchingItems) return false;
    }

    // Use DEBOUNCED query for filtering
    const lowerQ = debouncedSearchQuery.toLowerCase();
    if (!lowerQ) return true;

    // 1. Initial Match (Name, Cuisine, Location)
    const basicMatch =
      r.name.toLowerCase().includes(lowerQ) ||
      r.cuisine.toLowerCase().includes(lowerQ) ||
      r.location.toLowerCase().includes(lowerQ);

    if (basicMatch) return true;

    // 2. Deep Match (Items)
    const rItems = Object.values(restaurantItems)
      .flat()
      .filter((item) => item.restaurantId === r.id);
    const hasItemMatch = rItems.some((item) =>
      item.name.toLowerCase().includes(lowerQ)
    );

    return hasItemMatch;
  });

  // Filter Handpicked Products (Assumed Ahmedabad based for mock data)
  const filteredHandpickedProducts = products.filter((item) => {
    // 0. Location Filtering (Default to Ahmedabad)
    if (locationQuery.length > 0) {
      // For demo, we assume these products are available in Ahmedabad.
      // If user types 'Surat' or 'Gandhinagar', we might hide them or show specific ones.
      // For now, let's say they are available everywhere OR strict check.
      // User asked: "show restaurants and all items filtered by that city name".
      // Since mock data doesn't have city for products, I will just Allow them ALL or strictly restrict.
      // "Fix the logic so only matching items appear" -> implying if I select "Surat", I shouldn't see "Ahmedabad" items?
      // The restaurants have locations. Products don't.
      // I will implement a logic: If locationQuery matches 'Ahmedabad', show products. Else hide.
      return "Ahmedabad".toLowerCase().includes(locationQuery.toLowerCase());
    }

    // 1. Search Query Filtering
    const lowerQ = debouncedSearchQuery.toLowerCase();
    if (lowerQ) {
      return (
        item.name.toLowerCase().includes(lowerQ) ||
        (item.category && item.category.toLowerCase().includes(lowerQ))
      );
    }

    return true;
  });

  // Scroll Logic for "Inspiration" section
  const scrollRef = useRef(null);
  const scrollX = useRef(0);
  const [inspirationCanScrollLeft, setInspirationCanScrollLeft] =
    useState(false);
  const [inspirationCanScrollRight, setInspirationCanScrollRight] =
    useState(true);
  const inspirationContentWidth = useRef(0);
  const inspirationLayoutWidth = useRef(0);

  const handleScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    scrollX.current = x;

    // Left boundary
    const canLeft = x > 5;
    if (canLeft !== inspirationCanScrollLeft) {
      setInspirationCanScrollLeft(canLeft);
    }

    // Right boundary
    if (
      inspirationContentWidth.current > 0 &&
      inspirationLayoutWidth.current > 0
    ) {
      const isAtEnd =
        x + inspirationLayoutWidth.current >=
        inspirationContentWidth.current - 5;
      const canRight = !isAtEnd;
      if (canRight !== inspirationCanScrollRight) {
        setInspirationCanScrollRight(canRight);
      }
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      const newX = Math.max(0, scrollX.current - 600);
      scrollRef.current.scrollTo({ x: newX, animated: true });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const newX = scrollX.current + 600;
      const maxX = Math.max(
        0,
        inspirationContentWidth.current - inspirationLayoutWidth.current
      );
      const targetX = Math.min(newX, maxX);
      scrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  };

  // Animation Values (Mobile Only)
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.5);
  // Start well below screen to ensure no peeking
  const bottomSheetTranslateY = useSharedValue(SCREEN_HEIGHT + 300);
  const sheetOpacity = useSharedValue(0);

  useEffect(() => {
    if (!IS_WEB) {
      // Mobile Animation Sequence
      // 2. Login Sheet slides up after 2 seconds (allowing splash to be seen)
      // Ensure it stays invisible until it moves
      sheetOpacity.value = withDelay(2000, withTiming(1, { duration: 100 }));

      bottomSheetTranslateY.value = withDelay(
        2000,
        withTiming(0, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        })
      );
    } else {
      // Web: Just show icons immediately or simple fade
      iconOpacity.value = withTiming(1, { duration: 800 });
      iconScale.value = withSpring(1);
    }
  }, []);

  // Grocery Section Scroll Logic
  const groceryScrollRef = useRef(null);
  const [groceryCanScrollLeft, setGroceryCanScrollLeft] = useState(false);
  const [groceryCanScrollRight, setGroceryCanScrollRight] = useState(true);

  const groceryContentWidth = useRef(0);
  const groceryLayoutWidth = useRef(0);
  const groceryScrollX = useRef(0);

  // Handpicked Section Scroll Logic
  const handpickedScrollRef = useRef(null);
  const [handpickedCanScrollLeft, setHandpickedCanScrollLeft] = useState(false);
  const [handpickedCanScrollRight, setHandpickedCanScrollRight] =
    useState(true);

  const handpickedContentWidth = useRef(0);
  const handpickedLayoutWidth = useRef(0);
  const handpickedScrollX = useRef(0);

  const handleGroceryScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    groceryScrollX.current = x;

    // Left boundary
    const canLeft = x > 5;
    if (canLeft !== groceryCanScrollLeft) {
      setGroceryCanScrollLeft(canLeft);
    }

    // Right boundary
    if (groceryContentWidth.current > 0 && groceryLayoutWidth.current > 0) {
      const isAtEnd =
        x + groceryLayoutWidth.current >= groceryContentWidth.current - 5;
      const canRight = !isAtEnd;
      if (canRight !== groceryCanScrollRight) {
        setGroceryCanScrollRight(canRight);
      }
    }
  };

  const scrollGroceryLeft = () => {
    if (groceryScrollRef.current) {
      const newX = Math.max(0, groceryScrollX.current - 600);
      groceryScrollRef.current.scrollTo({ x: newX, animated: true });
    }
  };

  const scrollGroceryRight = () => {
    if (groceryScrollRef.current) {
      const newX = groceryScrollX.current + 600;
      // Clamp max? ScrollView handles overshoot usually, but good to be safe if we want to disable button accurately
      const maxX = Math.max(
        0,
        groceryContentWidth.current - groceryLayoutWidth.current
      );
      const targetX = Math.min(newX, maxX);
      groceryScrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  };

  const handleHandpickedScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    handpickedScrollX.current = x;

    // Left boundary
    const canLeft = x > 5;
    if (canLeft !== handpickedCanScrollLeft) {
      setHandpickedCanScrollLeft(canLeft);
    }

    // Right boundary
    if (
      handpickedContentWidth.current > 0 &&
      handpickedLayoutWidth.current > 0
    ) {
      const isAtEnd =
        x + handpickedLayoutWidth.current >= handpickedContentWidth.current - 5;
      const canRight = !isAtEnd;
      if (canRight !== handpickedCanScrollRight) {
        setHandpickedCanScrollRight(canRight);
      }
    }
  };

  const scrollHandpickedLeft = () => {
    if (handpickedScrollRef.current) {
      const newX = Math.max(0, handpickedScrollX.current - 600);
      handpickedScrollRef.current.scrollTo({ x: newX, animated: true });
    }
  };

  const scrollHandpickedRight = () => {
    if (handpickedScrollRef.current) {
      const newX = handpickedScrollX.current + 600;
      const maxX = Math.max(
        0,
        handpickedContentWidth.current - handpickedLayoutWidth.current
      );
      const targetX = Math.min(newX, maxX);
      handpickedScrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  };

  // Restaurant Scroll Logic
  const restaurantScrollRef = useRef(null);
  const [restaurantCanScrollLeft, setRestaurantCanScrollLeft] = useState(false);
  const [restaurantCanScrollRight, setRestaurantCanScrollRight] =
    useState(true);

  const restaurantContentWidth = useRef(0);
  const restaurantLayoutWidth = useRef(0);
  const restaurantScrollX = useRef(0);

  const handleRestaurantScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    restaurantScrollX.current = x;

    // Left boundary
    const canLeft = x > 5;
    if (canLeft !== restaurantCanScrollLeft) {
      setRestaurantCanScrollLeft(canLeft);
    }

    // Right boundary
    if (
      restaurantContentWidth.current > 0 &&
      restaurantLayoutWidth.current > 0
    ) {
      const isAtEnd =
        x + restaurantLayoutWidth.current >= restaurantContentWidth.current - 5;
      const canRight = !isAtEnd;
      if (canRight !== restaurantCanScrollRight) {
        setRestaurantCanScrollRight(canRight);
      }
    }
  };

  const scrollRestaurantLeft = () => {
    if (restaurantScrollRef.current) {
      const newX = Math.max(0, restaurantScrollX.current - 600);
      restaurantScrollRef.current.scrollTo({ x: newX, animated: true });
    }
  };

  const scrollRestaurantRight = () => {
    if (restaurantScrollRef.current) {
      const newX = restaurantScrollX.current + 600;
      const maxX = Math.max(
        0,
        restaurantContentWidth.current - restaurantLayoutWidth.current
      );
      const targetX = Math.min(newX, maxX);
      restaurantScrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  };

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomSheetTranslateY.value }],
    opacity: sheetOpacity.value,
  }));

  const handleContinue = () => {
    if (phoneNumber === "9999999999") {
      router.push({
        pathname: "/auth/otp",
        params: { phone: phoneNumber },
      });
    } else {
      alert("Please enter a valid registered number (9999999999)");
    }
  };

  return (
    <View style={styles.container}>
      {/* Background & Icons - WEB: REMOVED as per request */}
      {/* Container kept empty or removed entirely for cleaner look */}

      {/* Mobile: Bottom Sheet Login */}
      {!IS_WEB && (
        <Animated.View style={[styles.bottomSheet, animatedSheetStyle]}>
          <Text style={styles.loginTitle}>Login</Text>
          <Text style={styles.loginSubtitle}>
            Enter your phone number to proceed
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />
          </View>

          <Pressable style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push("/auth/signup")}>
              <Text style={styles.linkText}> Sign Up</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Web Landing Content */}
      {IS_WEB && (
        <ScrollView
          style={styles.webContent}
          contentContainerStyle={styles.webContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.webHeroSection}>
            <View
              style={[styles.webHeader, isMobileWeb && styles.webHeaderMobile]}
            >
              {/* Top Left: Delivery App logo/text */}
              {/* Top Left: Logo & Text */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={require("../assets/images/fresh_drop_logo.png")}
                  style={{ width: 40, height: 40, marginRight: 10 }}
                  resizeMode="contain"
                />
                <Text style={styles.webLogoText}>Fresh Drop</Text>
              </View>

              {/* Top Right: Sign In */}
              <Pressable
                style={styles.webSignInBtn}
                onPress={() => router.push("/auth/login")}
              >
                <Text style={styles.webSignInText}>Sign In</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.webHeroContent,
                isMobileWeb && { paddingHorizontal: 20 },
              ]}
            >
              <Text
                style={[
                  styles.webHeroTitle,
                  isMobileWeb && styles.webHeroTitleMobile,
                ]}
              >
                Order food & groceries. Discover best restaurants.
              </Text>

              <View
                style={[
                  styles.webSearchRow,
                  isMobileWeb && styles.webSearchRowMobile,
                ]}
              >
                {/* Location Input */}
                <View
                  style={[
                    styles.webLocationInput,
                    isMobileWeb && { width: "100%", borderRadius: 12 },
                  ]}
                >
                  <TextInput
                    ref={locationInputRef}
                    style={[styles.webLocTextInput, { paddingLeft: 16 }]}
                    placeholder="Enter your delivery location"
                    placeholderTextColor="#686b78"
                    value={locationQuery}
                    onChangeText={(text) => {
                      setLocationQuery(text);
                      setShowLocationSuggestions(text.length > 0);
                    }}
                    onFocus={() =>
                      locationQuery.length > 0 &&
                      setShowLocationSuggestions(true)
                    }
                    onBlur={() =>
                      setTimeout(() => setShowLocationSuggestions(false), 300)
                    }
                  />
                  <Pressable
                    onPress={() => {
                      if (!showLocationSuggestions) {
                        locationInputRef.current?.focus();
                        setShowLocationSuggestions(true);
                      } else {
                        setShowLocationSuggestions(false);
                      }
                    }}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                      justifyContent: "center",
                      alignItems: "center",
                      marginLeft: 8,
                      // @ts-ignore
                      ...Platform.select({ web: { cursor: "pointer" } }),
                    })}
                  >
                    <Feather name="chevron-down" size={20} color="#666" />
                  </Pressable>

                  {/* Suggestions List */}
                  {showLocationSuggestions && (
                    <View style={styles.suggestionsContainer}>
                      <FlatList
                        data={GUJARAT_CITIES.filter((c) =>
                          c.toLowerCase().includes(locationQuery.toLowerCase())
                        )}
                        keyExtractor={(item) => item}
                        keyboardShouldPersistTaps="always"
                        style={{ maxHeight: 200 }}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => {
                              setLocationQuery(item);
                              setShowLocationSuggestions(false);
                            }}
                          >
                            <Feather
                              name="map-pin"
                              size={14}
                              color="#666"
                              style={{ marginRight: 8 }}
                            />
                            <Text style={styles.suggestionText}>{item}</Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  )}
                </View>

                {/* Search Input */}
                <View
                  style={[
                    styles.webSearchInputContainer,
                    isMobileWeb && { width: "100%" },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.webSearchTextInput,
                      { outlineStyle: "none" },
                    ]}
                    placeholder="Search for restaurant, item or more"
                    placeholderTextColor="#686b78"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => {
                      setDebouncedSearchQuery(searchQuery);
                      setShowSearchSuggestions(false);
                    }}
                    onFocus={() => {
                      if (
                        searchQuery.length >= 1 &&
                        searchSuggestions.length > 0
                      ) {
                        setShowSearchSuggestions(true);
                      }
                    }}
                    onBlur={() =>
                      setTimeout(() => setShowSearchSuggestions(false), 300)
                    }
                  />
                  <Feather
                    name="search"
                    size={20}
                    color="#686b78"
                    style={styles.webSearchIcon}
                  />

                  {showSearchSuggestions && searchSuggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      <FlatList
                        data={searchSuggestions}
                        keyExtractor={(item) =>
                          `${item.type}-${item.name}-${item.id || Math.random()
                          }`
                        }
                        keyboardShouldPersistTaps="always"
                        style={{ maxHeight: 200 }}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => {
                              // If it's a specific food item, navigate directly
                              if (
                                item.type === "dish" ||
                                item.type === "product"
                              ) {
                                setSearchQuery(item.name);
                                setDebouncedSearchQuery(item.name); // Ensure background filters too
                                setShowSearchSuggestions(false);
                                router.push({
                                  pathname: "/product/[id]",
                                  params: { id: item.name },
                                });
                              } else {
                                // Category or Restaurant - Just filter
                                setSearchQuery(item.name);
                                setDebouncedSearchQuery(item.name);
                                setShowSearchSuggestions(false);
                              }
                            }}
                          >
                            <Feather
                              name={
                                item.type === "restaurant"
                                  ? "map-pin"
                                  : item.type === "category"
                                    ? "grid"
                                    : "coffee"
                              }
                              size={14}
                              color="#666"
                              style={{ marginRight: 8, marginTop: 2 }}
                            />
                            <View>
                              <Text style={styles.suggestionText}>
                                {item.name}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: "#999",
                                  textTransform: "capitalize",
                                }}
                              >
                                {item.type}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Side Images - Hide on Mobile Web */}
            {!isMobileWeb && (
              <>
                <Image
                  source={{
                    uri: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/portal/testing/seo-home/Veggies_new.png",
                  }}
                  style={styles.webSideImgLeft}
                  resizeMode="contain"
                />
                <Image
                  source={{
                    uri: "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/portal/testing/seo-home/Sushi_replace.png",
                  }}
                  style={styles.webSideImgRight}
                  resizeMode="contain"
                />
              </>
            )}
          </View>

          <View style={styles.webMainContainer}>
            {/* CONDITIONAL RENDER: Hide sections when searching or filtering by location */}
            {searchQuery.length === 0 && locationQuery.length === 0 ? (
              <>
                {/* 0. Landing Cards */}
                <View
                  style={[
                    styles.webCardsRow,
                    isMobileWeb && styles.webCardsRowMobile,
                  ]}
                >
                  {typeof landingCards !== "undefined" &&
                    landingCards.map((card) => (
                      <View
                        key={card.id}
                        style={[
                          styles.webLandingCard,
                          isMobileWeb && { width: "100%", marginBottom: 20 },
                        ]}
                      >
                        <View style={styles.webCardTextContent}>
                          <Text style={styles.webCardTitle}>{card.title}</Text>
                          <Text style={styles.webCardSubtitle}>
                            {card.subtitle}
                          </Text>
                          <Text style={styles.webCardTag}>{card.tag}</Text>
                          <Pressable
                            style={styles.webCardButton}
                            onPress={() => router.push(card.redirect)}
                          >
                            <Text style={styles.webCardButtonText}>
                              Order Now
                            </Text>
                            <Text style={styles.webCardArrow}>→</Text>
                          </Pressable>
                        </View>
                        <Image
                          source={{ uri: card.image }}
                          style={styles.webCardImage}
                          resizeMode="cover"
                        />
                      </View>
                    ))}
                </View>

                {/* 1. Food Options */}
                <View style={styles.webSectionHeader}>
                  <Text style={styles.webSectionTitle}>
                    Inspiration for your first order
                  </Text>
                  <View style={styles.webArrows}>
                    <Pressable
                      onPress={scrollLeft}
                      disabled={!inspirationCanScrollLeft}
                      style={({ pressed }) => [
                        styles.webArrowBtn,
                        pressed && { opacity: 0.7 },
                        !inspirationCanScrollLeft && {
                          opacity: 0.5,
                          backgroundColor: "#f1f2f6",
                        },
                      ]}
                    >
                      <Feather
                        name="arrow-left"
                        size={24}
                        color={
                          !inspirationCanScrollLeft ? "#9ca3af" : "#4b5563"
                        }
                      />
                    </Pressable>
                    <Pressable
                      onPress={scrollRight}
                      disabled={!inspirationCanScrollRight}
                      style={({ pressed }) => [
                        styles.webArrowBtn,
                        pressed && { opacity: 0.7 },
                        !inspirationCanScrollRight && {
                          opacity: 0.5,
                          backgroundColor: "#f1f2f6",
                        },
                      ]}
                    >
                      <Feather
                        name="arrow-right"
                        size={24}
                        color={
                          !inspirationCanScrollRight ? "#9ca3af" : "#4b5563"
                        }
                      />
                    </Pressable>
                  </View>
                </View>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={[
                    styles.webHorizontalScroll,
                    isMobileWeb && {
                      marginHorizontal: -20,
                      paddingHorizontal: 20,
                    },
                  ]}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={(w) => {
                    inspirationContentWidth.current = w;
                  }}
                  onLayout={(e) => {
                    inspirationLayoutWidth.current = e.nativeEvent.layout.width;
                  }}
                >
                  {isMobileWeb
                    ? foodOptions.map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.webItemValues}
                        onPress={() =>
                          router.push({
                            pathname: "/collection/[id]",
                            params: { id: item.name },
                          })
                        }
                      >
                        <View style={styles.webFoodImageContainer}>
                          <Image
                            source={
                              typeof item.image === "string"
                                ? { uri: item.image }
                                : item.image
                            }
                            style={styles.webFoodImage}
                            resizeMode="cover"
                          />
                        </View>
                        <Text style={styles.webItemText}>{item.name}</Text>
                      </Pressable>
                    ))
                    : Array.from({
                      length: Math.ceil(foodOptions.length / 2),
                    }).map((_, colIndex) => (
                      <View key={colIndex} style={styles.webDualRowColumn}>
                        {foodOptions
                          .slice(colIndex * 2, colIndex * 2 + 2)
                          .map((item) => (
                            <Pressable
                              key={item.id}
                              style={styles.webItemValues}
                              onPress={() =>
                                router.push({
                                  pathname: "/collection/[id]",
                                  params: { id: item.name },
                                })
                              }
                            >
                              <View style={styles.webFoodImageContainer}>
                                <Image
                                  source={
                                    typeof item.image === "string"
                                      ? { uri: item.image }
                                      : item.image
                                  }
                                  style={styles.webFoodImage}
                                  resizeMode="cover"
                                />
                              </View>
                              <Text style={styles.webItemText}>
                                {item.name}
                              </Text>
                            </Pressable>
                          ))}
                      </View>
                    ))}
                </ScrollView>

                <View style={styles.webSectionDivider} />

                {/* 2. Grocery Near By (Spoonacular) */}
                <View style={styles.webSectionHeader}>
                  <Text style={styles.webSectionTitle}>
                    Near By Grocery
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={[
                    styles.webHorizontalScroll,
                    isMobileWeb && {
                      marginHorizontal: -20,
                      paddingHorizontal: 20,
                    },
                  ]}
                >
                  {groceryItems.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.webItem}
                      onPress={() => router.push({
                        pathname: "/grocery/[id]",
                        params: {
                          id: item.id,
                          name: item.name,
                          address: item.address,
                          rating: item.rating,
                          time: item.time,
                          image: item.image
                        }
                      })}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.webCatImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.webItemText} numberOfLines={2}>{item.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={styles.webSectionDivider} />
              </>
            ) : null}

            {/* 2.5. Popular Products - Show when no search OR when search has matching products */}
            {searchQuery.length === 0 ||
              (searchQuery.length > 0 &&
                filteredHandpickedProducts.length > 0) ? (
              <>
                {/* 2.5. Popular Products */}
                {filteredHandpickedProducts.length > 0 && (
                  <>
                    <View style={styles.webSectionHeader}>
                      <Text style={styles.webSectionTitle}>
                        Handpicked Fresh Products
                      </Text>
                      <View style={styles.webArrows}>
                        <Pressable
                          onPress={scrollHandpickedLeft}
                          disabled={!handpickedCanScrollLeft}
                          style={({ pressed }) => [
                            styles.webArrowBtn,
                            pressed && { opacity: 0.7 },
                            !handpickedCanScrollLeft && {
                              opacity: 0.5,
                              backgroundColor: "#f1f2f6",
                            },
                          ]}
                        >
                          <Feather
                            name="arrow-left"
                            size={24}
                            color={
                              !handpickedCanScrollLeft ? "#9ca3af" : "#4b5563"
                            }
                          />
                        </Pressable>
                        <Pressable
                          onPress={scrollHandpickedRight}
                          disabled={!handpickedCanScrollRight}
                          style={({ pressed }) => [
                            styles.webArrowBtn,
                            pressed && { opacity: 0.7 },
                            !handpickedCanScrollRight && {
                              opacity: 0.5,
                              backgroundColor: "#f1f2f6",
                            },
                          ]}
                        >
                          <Feather
                            name="arrow-right"
                            size={24}
                            color={
                              !handpickedCanScrollRight ? "#9ca3af" : "#4b5563"
                            }
                          />
                        </Pressable>
                      </View>
                    </View>
                    <ScrollView
                      ref={handpickedScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={[
                        styles.webHorizontalScroll,
                        isMobileWeb && {
                          marginHorizontal: -20,
                          paddingHorizontal: 20,
                        },
                      ]}
                      onScroll={handleHandpickedScroll}
                      scrollEventThrottle={16}
                      onContentSizeChange={(w) => {
                        handpickedContentWidth.current = w;
                      }}
                      onLayout={(e) => {
                        handpickedLayoutWidth.current =
                          e.nativeEvent.layout.width;
                      }}
                    >
                      {filteredHandpickedProducts
                        .slice(0, 15)
                        .map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.webProductCard}
                            onPress={() =>
                              router.push({
                                pathname: "/product/[id]",
                                params: { id: item.name },
                              })
                            }
                          >
                            <View style={styles.webProductImageContainer}>
                              <Image
                                source={
                                  typeof item.image === "string"
                                    ? { uri: item.image }
                                    : item.image
                                }
                                style={styles.webProductImage}
                                resizeMode="contain"
                              />
                              <TouchableOpacity
                                style={styles.webAddButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  if (!user.phone) {
                                    router.push("/auth/login");
                                  } else {
                                    // Helper to generate ObjectId from restaurant name
                                    const toObjectId = (str = "") => {
                                      const hex = str.toString().split("").map(c => c.charCodeAt(0).toString(16)).join("");
                                      return (hex + "000000000000000000000000").slice(0, 24);
                                    };

                                    const restaurantId = item.restaurantId || toObjectId(item.restaurantName || "General");

                                    dispatch(
                                      addToCart({
                                        id: item.id || item.name,
                                        name: item.name,
                                        price: item.price,
                                        quantity: 1,
                                        image: item.image,
                                        veg: item.veg,
                                        restaurantId: restaurantId, // Add restaurantId
                                        restaurantName:
                                          item.restaurantName || "General",
                                      })
                                    );
                                    showToast(`${item.name} added to cart`);
                                  }
                                }}
                              >
                                <Text style={styles.webAddButtonText}>ADD</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={styles.webProductInfo}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginBottom: 4,
                                }}
                              >
                                <VegNonVegIcon veg={item.veg} size={14} />
                              </View>
                              <Text
                                style={styles.webProductName}
                                numberOfLines={2}
                              >
                                {item.name}
                              </Text>
                              <Text style={styles.webProductQty}>
                                {item.quantity}
                              </Text>
                              <View style={styles.webProductPriceRow}>
                                <Text style={styles.webProductPrice}>
                                  {"₹"}
                                  {item.price}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </>
                )}
              </>
            ) : null}

            {(filteredRestaurants.length > 0 || searchQuery.length > 0) && (
              <>
                {searchQuery.length === 0 && (
                  <View style={styles.webSectionDivider} />
                )}

                {/* 3. Top Restaurants / Search Results */}
                <View style={styles.webSectionHeader}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 20,
                      flex: 1,
                    }}
                  >
                    <Text style={styles.webSectionTitle}>
                      {searchQuery.length > 0
                        ? `Search Results for "${searchQuery}"`
                        : "Top Restaurants in Ahmedabad"}
                    </Text>
                    {/* Veg/Non-Veg Filter Buttons */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        style={[
                          styles.filterButton,
                          restaurantVegFilter === true &&
                          styles.filterButtonActiveVeg,
                        ]}
                        onPress={() =>
                          setRestaurantVegFilter(
                            restaurantVegFilter === true ? null : true
                          )
                        }
                      >
                        <VegNonVegIcon veg={true} size={14} />
                        <Text style={styles.filterButtonText}>Veg</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.filterButton,
                          restaurantVegFilter === false &&
                          styles.filterButtonActiveNonVeg,
                        ]}
                        onPress={() =>
                          setRestaurantVegFilter(
                            restaurantVegFilter === false ? null : false
                          )
                        }
                      >
                        <VegNonVegIcon veg={false} size={14} />
                        <Text style={styles.filterButtonText}>Non-Veg</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {searchQuery.length === 0 && (
                    <View style={styles.webArrows}>
                      <Pressable
                        onPress={scrollRestaurantLeft}
                        disabled={!restaurantCanScrollLeft}
                        style={({ pressed }) => [
                          styles.webArrowBtn,
                          pressed && { opacity: 0.7 },
                          !restaurantCanScrollLeft && {
                            opacity: 0.5,
                            backgroundColor: "#f1f2f6",
                          },
                        ]}
                      >
                        <Feather
                          name="arrow-left"
                          size={24}
                          color={
                            !restaurantCanScrollLeft ? "#9ca3af" : "#4b5563"
                          }
                        />
                      </Pressable>
                      <Pressable
                        onPress={scrollRestaurantRight}
                        disabled={!restaurantCanScrollRight}
                        style={({ pressed }) => [
                          styles.webArrowBtn,
                          pressed && { opacity: 0.7 },
                          !restaurantCanScrollRight && {
                            opacity: 0.5,
                            backgroundColor: "#f1f2f6",
                          },
                        ]}
                      >
                        <Feather
                          name="arrow-right"
                          size={24}
                          color={
                            !restaurantCanScrollRight ? "#9ca3af" : "#4b5563"
                          }
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              </>
            )}

            {isMobileWeb ? (
              filteredRestaurants.length === 0 &&
                filteredHandpickedProducts.length === 0 ? (
                <View
                  style={{ width: "100%", alignItems: "center", padding: 40 }}
                >
                  <Feather
                    name="frown"
                    size={48}
                    color="#ccc"
                    style={{ marginBottom: 16 }}
                  />
                  <Text
                    style={{ fontSize: 18, color: "#666", fontWeight: "600" }}
                  >
                    No results found
                  </Text>
                  <Text style={{ fontSize: 14, color: "#999", marginTop: 8 }}>
                    No restaurants, items, or categories match your search
                  </Text>
                </View>
              ) : (
                <ScrollView
                  ref={restaurantScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={[
                    styles.webHorizontalScroll,
                    { marginHorizontal: -20, paddingHorizontal: 20 },
                  ]}
                  onScroll={handleRestaurantScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={(w) => {
                    restaurantContentWidth.current = w;
                  }}
                  onLayout={(e) => {
                    restaurantLayoutWidth.current = e.nativeEvent.layout.width;
                  }}
                >
                  {filteredRestaurants.map((item) => (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.webRestCard,
                        { width: 300, marginRight: 20 },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: "/restaurant/[id]",
                          params: { id: item.id },
                        })
                      }
                    >
                      <Image
                        source={
                          typeof item.image === "string"
                            ? { uri: item.image }
                            : item.image
                        }
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
                    </Pressable>
                  ))}
                </ScrollView>
              )
            ) : filteredRestaurants.length === 0 &&
              filteredHandpickedProducts.length === 0 ? (
              <View
                style={{ width: "100%", alignItems: "center", padding: 40 }}
              >
                <Feather
                  name="frown"
                  size={48}
                  color="#ccc"
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{ fontSize: 18, color: "#666", fontWeight: "600" }}
                >
                  No results found
                </Text>
                <Text style={{ fontSize: 14, color: "#999", marginTop: 8 }}>
                  No restaurants, items, or categories match your search
                </Text>
              </View>
            ) : (
              <ScrollView
                ref={restaurantScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.webHorizontalScroll}
                onScroll={handleRestaurantScroll}
                scrollEventThrottle={16}
                onContentSizeChange={(w) => {
                  restaurantContentWidth.current = w;
                }}
                onLayout={(e) => {
                  restaurantLayoutWidth.current = e.nativeEvent.layout.width;
                }}
              >
                {filteredRestaurants.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.webRestCard, { marginRight: 20 }]}
                    onPress={() =>
                      router.push({
                        pathname: "/restaurant/[id]",
                        params: { id: item.id },
                      })
                    }
                  >
                    <Image
                      source={
                        typeof item.image === "string"
                          ? { uri: item.image }
                          : item.image
                      }
                      style={styles.webRestImage}
                      resizeMode="cover"
                    />
                    <View style={styles.webRestInfo}>
                      <Text style={styles.webRestName}>{item.name}</Text>
                      <Text style={styles.webRestMeta}>
                        {item.rating} • {item.time}
                      </Text>
                      <Text style={styles.webRestCuisine}>{item.cuisine}</Text>
                      <Text style={styles.webDiscountText}>
                        {item.discount}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      )}

      {/* Web: Login Modal */}
      {/* Web: Login Modal */}
      {IS_WEB && (
        <WebLoginModal
          visible={showWebLogin}
          onClose={() => setShowWebLogin(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // Changed from orange to white for better mobile UX
    // On web, container might need to be full height
    // @ts-ignore
    ...Platform.select({ web: { minHeight: "100vh" } }),
  },

  // Shared & Layout
  splashContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: IS_WEB ? 0 : 200,
  },
  splashContentWeb: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconsContainer: {
    alignItems: "center",
  },
  iconRow: {
    flexDirection: "row",
    gap: 30,
    marginBottom: 30,
  },
  iconItem: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 20,
    width: 80,
    height: 80,
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 32,
  },
  iconLabel: {
    color: "#fff",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
  },

  // Mobile Bottom Sheet
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    height: "100%", // Full screen height
    paddingTop: 100, // Add some top padding for content
  },

  // Web Modal
  webModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  webModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    width: 400,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },

  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
  },
  closeBtnText: {
    fontSize: 20,
    color: "#999",
  },

  // Form Styles (Shared)
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
    backgroundColor: "#f9f9f9",
  },
  countryCode: {
    fontSize: 16,
    color: "#333",
    marginRight: 12,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
    // Web specific focus outline removal could go here but styles are RN
  },
  button: {
    backgroundColor: "#FC8019",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    // @ts-ignore
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  linkText: {
    color: "#FC8019",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
    // @ts-ignore
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  // Web Content Styles
  webContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webContentContainer: {
    paddingBottom: 50,
  },
  webSectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    marginTop: 20,
  },
  webRow: {
    flexDirection: "row",
    gap: 24,
    overflow: "hidden", // Or use ScrollView logic if needed, simplify for now
    flexWrap: "wrap",
  },
  webItem: {
    alignItems: "center",
    marginBottom: 10,
    width: 140, // Standardize width
    marginRight: 20,
  },
  webFoodImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  webCatImage: {
    width: 140, // Increased size for better resolution
    height: 140, // Square aspect ratio
    marginBottom: 8,
    borderRadius: 70, // Circular
  },
  webItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
  },
  webGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  webRestCard: {
    width: 250,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  webRestImage: {
    width: "100%",
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  webRestInfo: {
    padding: 12,
  },
  webRestName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  webRestMeta: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  // Hero Section
  webHeroSection: {
    backgroundColor: "#FC8019",
    width: "100%",
    // @ts-ignore
    height: Platform.OS === "web" ? "100vh" : undefined,
    justifyContent: "center", // Center content vertically
    position: "relative",
    overflow: "hidden",
    paddingBottom: 0,
  },
  webHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 60,
    paddingVertical: 30,
    width: "100%",
    position: "absolute", // Pin to top
    top: 0,
    left: 0,
    zIndex: 20,
  },
  webLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  webLogoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    // @ts-ignore
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  webNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 30,
  },
  webNavLink: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    // @ts-ignore
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  webGetAppBtn: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  webGetAppText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  webSignInBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  webSignInText: {
    color: "#FC8019",
    fontWeight: "bold",
  },
  webHeroContent: {
    alignItems: "center",
    zIndex: 100, // Boost zIndex for the whole hero section
    width: "100%",
    // No fixed marginTop, centered by parent
  },
  webHeroTitle: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "800",
    textAlign: "center",
    maxWidth: 600,
    marginBottom: 30,
    letterSpacing: -0.5,
  },
  webSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 40,
    zIndex: 200, // Ensure search row is above everything
    position: "relative",
  },
  webLocationInput: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    width: 280,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderRadius: 12,
    position: "relative",
    zIndex: 20, // Stacking context for location
  },
  webLocIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  webLocTextInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    outlineStyle: "none",
    height: "100%",
  },
  webLocArrow: {
    color: "#666",
    fontSize: 18,
    marginLeft: 8,
  },
  webSearchInputContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    width: 450,
    borderRadius: 12,
    position: "relative",
    zIndex: 10, // Stacking context for search
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%", // Right below
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999, // Super high z-index
    overflow: "hidden",
  },
  webSearchTextInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    outlineStyle: "none",
  },
  webSearchIcon: {
    fontSize: 18,
  },
  webSideImgLeft: {
    position: "absolute",
    left: -50,
    bottom: 20,
    width: 300,
    height: 400,
    zIndex: 1,
  },
  webSideImgRight: {
    position: "absolute",
    right: -50,
    top: 100,
    width: 300,
    height: 400,
    zIndex: 1,
  },

  // Main Container for Content
  webMainContainer: {
    marginTop: 20,
    alignSelf: "center",
    width: "100%",
    maxWidth: "100%", // Full width
    paddingHorizontal: 40, // Increased padding for better look on wide screens
    zIndex: 20,
    backgroundColor: "#fff",
    paddingVertical: 32,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  webFoodImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
  },

  webCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    gap: 20,
    marginTop: 40, // Push down slightly
  },
  webLandingCard: {
    flex: 1,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000", // fallback
  },
  webCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 0.8,
  },
  webCardTextContent: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 2,
    padding: 24,
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  webCardTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  webCardSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 1,
  },
  webCardTag: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  webCardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  webCardButtonText: {
    color: "#FC8019",
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 4,
  },
  webCardArrow: {
    color: "#FC8019",
    fontWeight: "bold",
  },

  // Section Header & Navigation
  webSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  webArrows: {
    flexDirection: "row",
    gap: 12,
  },
  webArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    // @ts-ignore
    ...Platform.select({ web: { cursor: "pointer" } }),
  },

  // Horizontal Scroll Layout (Columns of 2 items)
  webHorizontalScroll: {
    marginBottom: 40,
    // No negative margin - align with parent padding
  },
  webSectionDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 32,
    width: "100%",
  },
  webDualRowColumn: {
    gap: 20, // Vertical gap between the 2 items
    marginRight: 30, // Horizontal gap between columns (increased)
    // First item padding
    paddingLeft: 0,
  },
  webItemValues: {
    alignItems: "center",
    width: 140,
  },
  // Misc
  webDiscountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B54909", // Darker Orange
    marginTop: 4,
  },

  // Product Card Styles
  webProductCard: {
    width: 160,
    marginRight: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    // elevation: 2,
    // border: '1px solid #e0e0e0', // Simple border for web if needed
  },
  webProductImageContainer: {
    width: "100%",
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    position: "relative",
    borderWidth: 1,
    borderColor: "#e2e2e7",
  },
  webProductImage: {
    width: 120, // Increased from 100
    height: 120,
  },
  webAddButton: {
    position: "absolute",
    bottom: -15, // floating detail
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#d4d5d9",
    // @ts-ignore
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
    height: 36, // fixed height for 2 lines
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

  // Mobile Web Responsive Styles
  webHeaderMobile: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  webHeroTitleMobile: {
    fontSize: 28,
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  webSearchRowMobile: {
    flexDirection: "column",
    gap: 12,
    paddingHorizontal: 0,
    width: "100%",
  },
  webCardsRowMobile: {
    flexDirection: "column",
    gap: 16,
    marginTop: 20,
    marginBottom: 20,
  },

  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  filterButtonActiveVeg: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  filterButtonActiveNonVeg: {
    borderColor: "#ef4444",
    backgroundColor: "#fee2e2",
  },
});
