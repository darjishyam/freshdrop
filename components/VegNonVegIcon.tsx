import { StyleSheet, View } from "react-native";

export const VegNonVegIcon = ({ veg, size = 16 }) => {
  // Check if veg is defined. If not, return null (no icon).
  if (veg === undefined || veg === null) {
    return null;
  }

  const isVeg = veg;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isVeg ? "#0F8A0F" : "#E74C3C",
          width: size,
          height: size,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: isVeg ? "#0F8A0F" : "#E74C3C",
            width: size * 0.45,
            height: size * 0.45,
            borderRadius: (size * 0.45) / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
  },
  dot: {
    // Dimensions set dynamically based on size prop
  },
});
