import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Reusable Product Card Component
 * @param {object} product - Product data
 * @param {function} onPress - Card press handler
 * @param {function} onAddPress - Add button press handler
 * @param {object} style - Additional styles
 */
export default function ProductCard({ product, onPress, onAddPress, style }) {
  const getImageSource = (img) => {
    if (typeof img === "string") return { uri: img };
    return img;
  };

  const discountPercent = product.discountPrice
    ? Math.round(
        ((product.discountPrice - product.price) / product.discountPrice) * 100
      )
    : 0;

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      {discountPercent > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountPercent}% OFF</Text>
        </View>
      )}

      <View style={styles.imageContainer}>
        <Image
          source={getImageSource(product.image)}
          style={styles.image}
          resizeMode="contain"
        />
        {onAddPress && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation();
              onAddPress();
            }}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.quantity}>{product.quantity}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price}</Text>
          {product.discountPrice && (
            <Text style={styles.oldPrice}>₹{product.discountPrice}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginRight: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  discountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  imageContainer: {
    width: "100%",
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  addButton: {
    position: "absolute",
    bottom: -10,
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
  info: {
    padding: 12,
    paddingTop: 16,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3e4152",
    marginBottom: 4,
    height: 36,
  },
  quantity: {
    fontSize: 12,
    color: "#9fa3af",
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3e4152",
  },
  oldPrice: {
    fontSize: 12,
    color: "#9fa3af",
    textDecorationLine: "line-through",
  },
});
