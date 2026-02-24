import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
import { useDispatch, useSelector } from "react-redux";
import { VegNonVegIcon } from "../../components/VegNonVegIcon";
import { useToast } from "../../context/ToastContext";
import { getGroceryInventory, groceryCategories } from "../../data/mockData";
import { addToCart, clearCart, selectCartRestaurant } from "../../store/slices/cartSlice";
import { selectUser } from "../../store/slices/userSlice";
import { API_BASE_URL } from "../../constants/api";

export default function GroceryStoreScreen() {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const params = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useToast();
    const cartRestaurant = useSelector(selectCartRestaurant);

    const { id, name, address, image, rating, time, isLocal } = params;

    // State
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [dynamicCategories, setDynamicCategories] = useState([]);

    // Load Inventory
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (isLocal === "true" || id.length === 24) {
                    console.log("Fetching real grocery data for store:", id);
                    const response = await fetch(`${API_BASE_URL}/restaurants/${id}`);
                    if (!response.ok) throw new Error("Failed to fetch store data");
                    const data = await response.json();

                    if (data.products) {
                        const formattedProducts = data.products.map(p => ({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            description: p.description || p.name,
                            image: p.image,
                            category: p.category || "General",
                            veg: p.veg,
                            weight: p.weight || p.quantityDetails || "",
                            brand: p.brandName || ""
                        }));
                        setInventory(formattedProducts);

                        // Extract unique categories
                        const cats = [...new Set(formattedProducts.map(p => p.category))];
                        setDynamicCategories(cats.map(c => ({ id: c, name: c })));
                    }
                } else {
                    // Fallback to mock data for external stores
                    setTimeout(() => {
                        const items = getGroceryInventory(id);
                        setInventory(items);
                    }, 500);
                }
            } catch (error) {
                console.error("Error loading grocery data:", error);
                // Fallback to mock on error
                const items = getGroceryInventory(id);
                setInventory(items);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, isLocal]);

    // Filter Items
    const categoriesToRender = dynamicCategories.length > 0 ? dynamicCategories : groceryCategories;

    const filteredItems = useMemo(() => {
        let items = inventory;

        if (selectedCategory !== "ALL") {
            items = items.filter(item => item.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            items = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        return items;
    }, [inventory, selectedCategory, searchQuery]);


    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FC8019" />
                    <Text style={{ marginTop: 10 }}>Loading store...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const renderItem = ({ item }) => (
        <Pressable
            key={item.id}
            style={styles.itemCard}
            onPress={() => console.log('Item clicked', item.name)}
        >
            <View style={styles.itemInfo}>
                <View style={styles.classifierRow}>
                    <VegNonVegIcon veg={item.veg} size={16} />
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                    <FontAwesome name="rupee" size={13} color="#333" /> {item.price}
                    {item.oldPrice && (
                        <Text style={styles.oldPrice}> <FontAwesome name="rupee" size={11} color="#999" /> {item.oldPrice}</Text>
                    )}
                </Text>
                <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.description}
                </Text>
            </View>

            <View style={styles.itemImageContainer}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    resizeMode="cover"
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        if (!user.phone) {
                            router.push("/auth/login");
                            return;
                        }

                        const handleAddAction = () => {
                            dispatch(
                                addToCart({
                                    id: item.id,
                                    name: item.name,
                                    price: item.price,
                                    quantity: 1,
                                    image: item.image,
                                    restaurantId: id, // Treat Store ID as Restaurant ID for cart grouping
                                    restaurantName: name,
                                    veg: item.veg,
                                    weight: item.weight,
                                    supplier: name,
                                })
                            );
                            showToast(`${item.name} added to cart`);
                        };

                        // Validation: Single Restaurant check
                        if (cartRestaurant.id && cartRestaurant.id !== id) {
                            const msg = `Your cart contains items from ${cartRestaurant.name || 'another restaurant'}. Do you want to discard the selection and add this item?`;

                            if (Platform.OS === 'web') {
                                if (window.confirm(msg)) {
                                    dispatch(clearCart());
                                    handleAddAction();
                                }
                            } else {
                                Alert.alert(
                                    "Replace cart item?",
                                    msg,
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                            text: "Clear & Add",
                                            onPress: () => {
                                                dispatch(clearCart());
                                                handleAddAction();
                                            }
                                        }
                                    ]
                                );
                            }
                            return;
                        }

                        handleAddAction();
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView stickyHeaderIndices={[1]}>
                {/* Store Info */}
                <View style={styles.storeInfoContainer}>
                    <View style={styles.storeMetaRow}>
                        <View>
                            <Text style={styles.storeName}>{name}</Text>
                            <Text style={styles.storeAddress}>{address}</Text>
                            <Text style={styles.storeTime}>{time || '30-40 mins'} • {loading ? '' : inventory.length + ' items'}</Text>
                        </View>
                        <View style={styles.ratingBox}>
                            <Text style={styles.ratingText}>{rating || '4.2'}</Text>
                            <Ionicons name="star" size={12} color="white" />
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.offerText}>
                        <Ionicons name="pricetag" size={14} color="#2563eb" /> Free Delivery on orders above ₹500
                    </Text>
                </View>

                {/* Categories (Sticky) */}
                <View style={styles.categoriesContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                        <TouchableOpacity
                            style={[styles.categoryPill, selectedCategory === "ALL" && styles.categoryPillActive]}
                            onPress={() => setSelectedCategory("ALL")}
                        >
                            <Text style={[styles.categoryText, selectedCategory === "ALL" && styles.categoryTextActive]}>All</Text>
                        </TouchableOpacity>
                        {categoriesToRender.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.categoryPill, selectedCategory === cat.name && styles.categoryPillActive]}
                                onPress={() => setSelectedCategory(cat.name)}
                            >
                                <Text style={[styles.categoryText, selectedCategory === cat.name && styles.categoryTextActive]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Inventory List */}
                <View style={styles.productList}>
                    <Text style={styles.sectionTitle}>
                        {selectedCategory === "ALL" ? "All Products" : selectedCategory} ({filteredItems.length})
                    </Text>
                    {filteredItems.map(item => (
                        <React.Fragment key={item.id}>
                            {renderItem({ item })}
                            <View style={styles.separator} />
                        </React.Fragment>
                    ))}
                    {filteredItems.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No items found in this category.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* View Cart Floating Button (Optional, if handled globally it might show up over this) */}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center'
    },
    storeInfoContainer: {
        padding: 16,
        backgroundColor: '#fff',
    },
    storeMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    storeName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 4,
        width: 250
    },
    storeAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        maxWidth: 250
    },
    storeTime: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500'
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#22c55e',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4
    },
    ratingText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12
    },
    offerText: {
        color: '#4b5563',
        fontSize: 13,
        fontWeight: '500',
    },
    categoriesContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        elevation: 2, // Shadow for android sticky effect
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 }
    },
    categoriesList: {
        paddingHorizontal: 16,
        gap: 10
    },
    categoryPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    categoryPillActive: {
        backgroundColor: '#333',
        borderColor: '#333'
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666'
    },
    categoryTextActive: {
        color: '#fff'
    },
    productList: {
        padding: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#111'
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    itemInfo: {
        flex: 1,
        paddingRight: 12
    },
    classifierRow: {
        marginBottom: 4
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
        marginBottom: 6
    },
    oldPrice: {
        fontSize: 13,
        color: '#999',
        textDecorationLine: 'line-through',
        fontWeight: 'normal'
    },
    itemDesc: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18
    },
    itemImageContainer: {
        width: 110,
        height: 110,
        position: 'relative'
    },
    itemImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        backgroundColor: '#f0f0f0'
    },
    addButton: {
        position: 'absolute',
        bottom: -10,
        left: '15%',
        width: '70%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 6,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 }
    },
    addButtonText: {
        color: '#22c55e',
        fontWeight: '800',
        fontSize: 14
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginBottom: 16
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic'
    }
});
