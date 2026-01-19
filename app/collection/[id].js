import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { VegNonVegIcon } from "../../components/VegNonVegIcon";
import { useToast } from "../../context/ToastContext";
import { products, restaurantItems } from "../../data/mockData";
import { addToCart } from "../../store/slices/cartSlice";
import { selectUser } from "../../store/slices/userSlice";

export default function CollectionScreen() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { id } = useLocalSearchParams();
  const categoryName = typeof id === "string" ? id : "";
  const router = useRouter();
  const { showToast } = useToast();
  const [showVegOnly, setShowVegOnly] = useState(false);

  // Use useMemo for items calculation
  const { allItems, hasVeg, hasNonVeg } = useMemo(() => {
    // Get items for this category (search both)
    const restItems = restaurantItems[categoryName] || [];
    const groceryItems = products.filter((p) => p.category === categoryName);
    const combined = [...restItems, ...groceryItems];

    // Check for mixed content
    const hasVeg = combined.some((i) => i.veg === true);
    const hasNonVeg = combined.some((i) => i.veg === false);

    return { allItems: combined, hasVeg, hasNonVeg };
  }, [categoryName]);

  const filteredItems = useMemo(() => {
    if (showVegOnly) {
      return allItems.filter((item) => item.veg === true);
    }
    return allItems;
  }, [allItems, showVegOnly]);

  const renderItem = ({ item }) => {
    const isFood = !!item.restaurantName;

    const handlePress = () => {
      router.push({
        pathname: "/product/[id]",
        params: {
          id: item.name,
          name: item.name,
          price: item.price,
          image: typeof item.image === "string" ? item.image : undefined,
          description: item.description,
          category: categoryName,
          rating: item.rating,
          ratingCount: item.ratingCount,
          weight: item.weight,
        },
      });
    };

    return (
      <TouchableOpacity style={styles.itemCard} onPress={handlePress}>
        <View style={styles.itemInfo}>
          {isFood ? (
            <>
              <View style={styles.classifierRow}>
                <VegNonVegIcon veg={item.veg} size={16} />
                {item.bestSeller && (
                  <Text style={styles.bestSellerTag}>Bestseller</Text>
                )}
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>
                {"₹"}
                {item.price}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="green" />
                <Text style={styles.ratingText}>{item.rating}</Text>
                {item.weight ? (
                  <Text style={[styles.ratingText, { marginLeft: 8 }]}>
                    • {item.weight}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.itemDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.restaurantName}>
                By {item.restaurantName}
              </Text>
            </>
          ) : (
            <>
              <View style={{ marginBottom: 4 }}>
                <VegNonVegIcon veg={item.veg} size={14} />
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.quantity}</Text>
              <Text style={styles.itemPrice}>
                {"₹"}
                {item.price}
              </Text>
            </>
          )}
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
            onPress={() => {
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
                    restaurantId: item.restaurantName || "General",
                    veg: item.veg,
                  })
                );
                showToast(`${item.name} added to cart`);
              }
            }}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const showFilter = hasVeg && hasNonVeg;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>

        {showFilter && (
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Veg Only</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#22c55e" }}
              thumbColor={showVegOnly ? "#f4f3f4" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => setShowVegOnly(!showVegOnly)}
              value={showVegOnly}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        )}
      </View>
      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No items found for {categoryName}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.goBackButton}
          >
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    padding: 16,
    paddingHorizontal: Platform.OS === "android" ? 20 : 16,
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 16,
    justifyContent: "center",
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
    fontFamily: "Poppins_600SemiBold",
  },
  itemName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
    fontFamily: "Poppins_700Bold",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    fontFamily: "Poppins_600SemiBold",
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
    fontFamily: "Poppins_600SemiBold",
  },
  itemDesc: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 6,
    fontFamily: "Poppins_400Regular",
  },
  restaurantName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 4,
    fontFamily: "Poppins_600SemiBold",
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
    color: "#22c55e", // Green text
    fontWeight: "800",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
    borderStyle: "dashed", // Dashed line separator
    borderWidth: 0.5, // Simulate via standard if needed, but solid is fine
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
    fontFamily: "Poppins_400Regular",
  },
  goBackButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#ff6600",
    borderRadius: 8,
  },
  goBackText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: Platform.OS === "android" ? 20 : 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 12,
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
  filterButtonActive: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Poppins_600SemiBold",
  },
});
