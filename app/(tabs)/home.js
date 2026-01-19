import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../context/ToastContext";
import {
  categories,
  foodOptions,
  products,
  restaurants,
} from "../../data/mockData";
import { addToCart } from "../../store/slices/cartSlice";
import {
  selectLocation,
  selectLocationType,
  selectUser,
} from "../../store/slices/userSlice";

const { width } = Dimensions.get("window");

// --- Mock Data ---
const SEARCH_ITEMS = [
  " 'Biryani'",
  " 'Grocery'",
  " 'Pizza'",
  " 'Milk'",
  " 'Cake'",
];

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const location = useSelector(selectLocation);
  const locationType = useSelector(selectLocationType);
  const { showToast } = useToast();

  // State

  // State for search
  const [searchQuery, setSearchQuery] = useState("");

  // Update Search Results with useMemo for performance
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();

    // Filter Restaurants
    const filteredRestaurants = restaurants
      .filter((r) => r.name.toLowerCase().includes(query))
      .map((r) => ({ type: "Restaurant", data: r }));
    // Filter Categories
    const filteredCategories = categories
      .filter((c) => c.name.toLowerCase().includes(query))
      .map((c) => ({ type: "Category", data: c }));
    // Filter Food Options
    const filteredFood = foodOptions
      .filter((f) => f.name.toLowerCase().includes(query))
      .map((f) => ({ type: "Food", data: f }));
    // Filter Products
    const filteredProducts = products
      .filter((p) => p.name.toLowerCase().includes(query))
      .map((p) => ({ type: "Product", data: p }));

    return [
      ...filteredRestaurants,
      ...filteredCategories,
      ...filteredFood,
      ...filteredProducts,
    ];
  }, [searchQuery]);

  // Helper for image source
  const getImageSource = (img) => {
    if (typeof img === "string") return { uri: img };
    return img;
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
      <View style={styles.contentContainer}>
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
                    name={locationType === "Work" ? "briefcase" : "home"}
                    size={20}
                    color="#FC8019"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{ fontSize: 18, fontWeight: "bold", color: "#333" }}
                  >
                    {locationType}
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
                        router.push({
                          pathname: "/restaurant/[id]",
                          params: { id: item.data.id },
                        });
                      } else if (item.type === "Product") {
                        router.push({
                          pathname: "/product/[id]",
                          params: { id: item.data.name },
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
              {/* Best Food Options */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Order our best food options
                  </Text>
                  <View style={styles.navButtons}>
                    <TouchableOpacity
                      style={[
                        styles.navBtn,
                        !foodCanScrollLeft && styles.navBtnDisabled,
                      ]}
                      onPress={() => scrollFood("left")}
                      disabled={!foodCanScrollLeft}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={20}
                        color={foodCanScrollLeft ? "#4b5563" : "#9ca3af"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.navBtn,
                        !foodCanScrollRight && styles.navBtnDisabled,
                      ]}
                      onPress={() => scrollFood("right")}
                      disabled={!foodCanScrollRight}
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={foodCanScrollRight ? "#4b5563" : "#9ca3af"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
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
                  {Platform.OS === "web"
                    ? Array.from({
                        length: Math.ceil(foodOptions.length / 2),
                      }).map((_, i) => {
                        const item1 = foodOptions[i * 2];
                        const item2 = foodOptions[i * 2 + 1];
                        return (
                          <View key={i} style={{ marginRight: 20 }}>
                            <TouchableOpacity
                              style={[styles.webItemValues, { marginRight: 0 }]}
                              onPress={() =>
                                router.push({
                                  pathname: "/collection/[id]",
                                  params: { id: item1.name },
                                })
                              }
                            >
                              <View style={styles.webFoodImageContainer}>
                                <Image
                                  source={getImageSource(item1.image)}
                                  style={styles.webFoodImage}
                                  resizeMode="cover"
                                />
                              </View>
                              <Text style={styles.webItemText}>
                                {item1.name}
                              </Text>
                            </TouchableOpacity>
                            {item2 && (
                              <TouchableOpacity
                                style={[
                                  styles.webItemValues,
                                  { marginRight: 0, marginTop: 24 },
                                ]}
                                onPress={() =>
                                  router.push({
                                    pathname: "/collection/[id]",
                                    params: { id: item2.name },
                                  })
                                }
                              >
                                <View style={styles.webFoodImageContainer}>
                                  <Image
                                    source={getImageSource(item2.image)}
                                    style={styles.webFoodImage}
                                    resizeMode="cover"
                                  />
                                </View>
                                <Text style={styles.webItemText}>
                                  {item2.name}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })
                    : foodOptions.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.foodItem}
                          onPress={() =>
                            router.push({
                              pathname: "/collection/[id]",
                              params: { id: item.name },
                            })
                          }
                        >
                          <View style={styles.foodImageContainer}>
                            <Image
                              source={getImageSource(item.image)}
                              style={styles.foodOptionImage}
                              resizeMode="cover"
                            />
                          </View>
                          <Text style={styles.itemLabel}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                </ScrollView>
                {Platform.OS === "web" && (
                  <View style={styles.webSectionDivider} />
                )}
              </View>

              {/* Shop by Category (Grocery Options) */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Shop by Category</Text>
                  <View style={styles.navButtons}>
                    <TouchableOpacity
                      style={[
                        styles.navBtn,
                        !categoryCanScrollLeft && styles.navBtnDisabled,
                      ]}
                      onPress={() => scrollCategory("left")}
                      disabled={!categoryCanScrollLeft}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={20}
                        color={categoryCanScrollLeft ? "#4b5563" : "#9ca3af"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.navBtn,
                        !categoryCanScrollRight && styles.navBtnDisabled,
                      ]}
                      onPress={() => scrollCategory("right")}
                      disabled={!categoryCanScrollRight}
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={categoryCanScrollRight ? "#4b5563" : "#9ca3af"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <ScrollView
                  ref={categoryScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.horizontalList,
                    Platform.OS === "web" && styles.webHorizontalScroll,
                  ]}
                  onScroll={handleCategoryScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={(w) => {
                    categoryContentWidth.current = w;
                  }}
                  onLayout={(e) => {
                    categoryLayoutWidth.current = e.nativeEvent.layout.width;
                  }}
                >
                  {categories.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={
                        Platform.OS === "web"
                          ? styles.webItemValues
                          : styles.categoryItem
                      }
                      onPress={() =>
                        router.push({
                          pathname: "/collection/[id]",
                          params: { id: item.name },
                        })
                      }
                    >
                      <View
                        style={
                          Platform.OS === "web"
                            ? styles.webFoodImageContainer
                            : styles.categoryImageContainer
                        }
                      >
                        <Image
                          source={getImageSource(item.image)}
                          style={
                            Platform.OS === "web"
                              ? styles.webFoodImage
                              : styles.categoryImage
                          }
                          resizeMode="cover"
                        />
                      </View>
                      <Text
                        style={
                          Platform.OS === "web"
                            ? styles.webItemText
                            : styles.categoryLabel
                        }
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {Platform.OS === "web" && (
                  <View style={styles.webSectionDivider} />
                )}
              </View>

              {/* Suggested Products (NEW) */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Suggested Products</Text>
                  <View style={styles.navButtons}>
                    <TouchableOpacity
                      style={[
                        styles.navBtn,
                        !productCanScrollLeft && styles.navBtnDisabled,
                      ]}
                      onPress={() => scrollProduct("left")}
                      disabled={!productCanScrollLeft}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={20}
                        color={productCanScrollLeft ? "#4b5563" : "#9ca3af"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.navBtn,
                        !productCanScrollRight && styles.navBtnDisabled,
                      ]}
                      onPress={() => scrollProduct("right")}
                      disabled={!productCanScrollRight}
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={productCanScrollRight ? "#4b5563" : "#9ca3af"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
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
                  {products.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={
                        Platform.OS === "web"
                          ? styles.webProductCard
                          : styles.productCard
                      }
                      onPress={() =>
                        router.push({
                          pathname: "/product/[id]",
                          params: { id: item.name },
                        })
                      }
                    >
                      {/* Discount Badge */}
                      {Platform.OS !== "web" && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>
                            {Math.round(
                              ((item.discountPrice - item.price) /
                                item.discountPrice) *
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
                              : styles.productImage
                          }
                          resizeMode="contain"
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
                                    ...item,
                                    quantity: 1,
                                    id: item.name,
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
                                    ...item,
                                    quantity: 1,
                                    id: item.name,
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
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* RESTAURANTS SECTION */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Discover best restaurants
                  </Text>
                  <View style={styles.navButtons}>
                    <TouchableOpacity
                      style={[
                        styles.navBtn,
                        !restaurantCanScrollLeft && styles.navBtnDisabled,
                      ]}
                      onPress={() => scrollRestaurant("left")}
                      disabled={!restaurantCanScrollLeft}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={20}
                        color={restaurantCanScrollLeft ? "#4b5563" : "#9ca3af"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.navBtn,
                        !restaurantCanScrollRight && styles.navBtnDisabled,
                      ]}
                      onPress={() => scrollRestaurant("right")}
                      disabled={!restaurantCanScrollRight}
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={restaurantCanScrollRight ? "#4b5563" : "#9ca3af"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
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
                  {restaurants.map((item) =>
                    Platform.OS === "web" ? (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.webRestCard}
                        onPress={() =>
                          router.push({
                            pathname: "/restaurant/[id]",
                            params: { id: item.id },
                          })
                        }
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
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.restaurantCard}
                        onPress={() =>
                          router.push({
                            pathname: "/restaurant/[id]",
                            params: { id: item.id },
                          })
                        }
                      >
                        <View style={styles.restImageContainer}>
                          <Image
                            source={getImageSource(item.image)}
                            style={styles.restImage}
                            resizeMode="cover"
                          />
                          <View style={styles.promotedTag}>
                            <Text style={styles.promotedText}>Promoted</Text>
                          </View>
                          <View style={styles.restDiscountBadge}>
                            <Text style={styles.restDiscountText}>
                              {item.discount}
                            </Text>
                          </View>
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
                            <Text style={styles.restName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <View style={styles.ratingBadge}>
                              <Text style={styles.ratingVal}>
                                {item.rating}
                              </Text>
                              <Ionicons
                                name="star"
                                size={10}
                                color="#fff"
                                style={{ marginLeft: 2 }}
                              />
                            </View>
                          </View>
                          <View style={styles.restMetaRow}>
                            <Text style={styles.cuisineText} numberOfLines={1}>
                              {item.cuisine}
                            </Text>
                            <Text style={styles.priceText}>
                              {item.priceForTwo}
                            </Text>
                          </View>
                          <View style={styles.restLocationRow}>
                            <Ionicons
                              name="location-outline"
                              size={14}
                              color="#9ca3af"
                            />
                            <Text style={styles.locationText} numberOfLines={1}>
                              {item.location} • {item.time}
                            </Text>
                          </View>
                          <View style={styles.bookingRow}>
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#059669"
                            />
                            <Text style={styles.bookingText}>
                              Table booking available
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>
                {Platform.OS === "web" && (
                  <View style={styles.webSectionDivider} />
                )}
              </View>
              {/* Promo Banner Example */}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
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
      },
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
    marginTop: 24,
    paddingHorizontal: Platform.OS === "web" ? 0 : 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#020617",
    marginBottom: 16,
    paddingHorizontal: 16,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 16,
  },

  // Food Items (Circular)
  foodItem: { alignItems: "center", width: 80 },
  foodImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    // Remove Border for cleaner look if images are transparent
    borderWidth: 0,
  },
  foodOptionImage: { width: "100%", height: "100%", borderRadius: 35 },
  itemLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "center",
  },

  // RESTAURANT CARD STYLES
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  navButtons: { flexDirection: "row", gap: 10 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
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
    width: Platform.OS === "web" ? 120 : 85,
    marginRight: Platform.OS === "web" ? 20 : 0,
  },
  categoryImageContainer: {
    width: Platform.OS === "web" ? 100 : 80,
    height: Platform.OS === "web" ? 100 : 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 0,
    overflow: "hidden",
  },
  categoryImage: { width: "100%", height: "100%" },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 2,
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
  productImage: { width: "100%", height: 100, marginBottom: 8 },
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
    backgroundColor: "#f0f0f0",
    marginVertical: 32,
    width: "100%",
  },
  webHorizontalScroll: {
    marginBottom: 40,
  },
  webItemValues: {
    alignItems: "center",
    width: 140,
    marginRight: 20,
  },

  // Web Restaurant Card
  webRestCard: {
    width: 250,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    marginRight: 20,
    // Shadow
    // Shadow
    ...Platform.select({
      web: { boxShadow: "0px 2px 5px rgba(0,0,0,0.1)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
    }),
    ...Platform.select({ web: { cursor: "pointer" } }),
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

  // Web Product Card
  webProductCard: {
    width: 160,
    marginRight: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
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
    width: 120,
    height: 120,
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
  webFoodImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 8,
  },
  webFoodImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  webItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
  },
  navButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  navBtnDisabled: {
    opacity: 0.5,
    backgroundColor: "#f1f2f6",
  },
});
