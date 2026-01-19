import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Reusable Restaurant Card Component
 * @param {object} restaurant - Restaurant data
 * @param {function} onPress - Card press handler
 * @param {object} style - Additional styles
 * @param {boolean} compact - Use compact layout (default: false)
 */
export default function RestaurantCard({
  restaurant,
  onPress,
  style,
  compact = false,
}) {
  const getImageSource = (img) => {
    if (typeof img === "string") return { uri: img };
    return img;
  };

  if (compact) {
    return (
      <TouchableOpacity style={[styles.compactCard, style]} onPress={onPress}>
        <Image
          source={getImageSource(restaurant.image)}
          style={styles.compactImage}
          resizeMode="cover"
        />
        <View style={styles.compactInfo}>
          <Text style={styles.compactName}>{restaurant.name}</Text>
          <Text style={styles.compactMeta}>
            {restaurant.rating} • {restaurant.time}
          </Text>
          <Text style={styles.compactCuisine}>{restaurant.cuisine}</Text>
          <Text style={styles.compactDiscount}>{restaurant.discount}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={getImageSource(restaurant.image)}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.promotedTag}>
          <Text style={styles.promotedText}>Promoted</Text>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{restaurant.discount}</Text>
        </View>
        <View style={styles.bookmarkIcon}>
          <Ionicons name="bookmark-outline" size={20} color="#fff" />
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.rating}>{restaurant.rating}</Text>
            <Ionicons
              name="star"
              size={10}
              color="#fff"
              style={{ marginLeft: 2 }}
            />
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.cuisine} numberOfLines={1}>
            {restaurant.cuisine}
          </Text>
          <Text style={styles.price}>{restaurant.priceForTwo}</Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#9ca3af" />
          <Text style={styles.location} numberOfLines={1}>
            {restaurant.location} • {restaurant.time}
          </Text>
        </View>

        <View style={styles.bookingRow}>
          <Ionicons name="calendar-outline" size={14} color="#059669" />
          <Text style={styles.bookingText}>Table booking available</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    marginRight: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  promotedTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promotedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  discountBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#FC8019",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  bookmarkIcon: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  info: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22c55e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rating: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cuisine: {
    fontSize: 13,
    color: "#6b7280",
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 13,
    color: "#6b7280",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    color: "#9ca3af",
    marginLeft: 4,
    flex: 1,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookingText: {
    fontSize: 12,
    color: "#059669",
    marginLeft: 4,
    fontWeight: "600",
  },
  // Compact styles
  compactCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  compactImage: {
    width: "100%",
    height: 120,
  },
  compactInfo: {
    padding: 12,
  },
  compactName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  compactMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  compactCuisine: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  compactDiscount: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FC8019",
  },
});
