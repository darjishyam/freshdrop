import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { selectCartCount } from "../store/slices/cartSlice";

export const CartFab = () => {
  const cartCount = useSelector(selectCartCount);
  const router = useRouter();
  const pathname = usePathname();

  if (
    cartCount === 0 ||
    pathname.includes("/cart") ||
    pathname.includes("/payment") ||
    pathname.includes("/profile")
  )
    return null;

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push("/cart")}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="cart" size={24} color="#fff" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cartCount}</Text>
        </View>
      </View>
      <Text style={styles.text}>View Cart</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#FC8019",
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1000,
  },
  iconContainer: {
    position: "relative",
    marginRight: 8,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FC8019",
  },
  badgeText: {
    color: "#FC8019",
    fontSize: 10,
    fontWeight: "bold",
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
