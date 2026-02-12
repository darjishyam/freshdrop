import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../context/ToastContext";
import { addReview } from "../../store/slices/reviewsSlice";
import { selectUser } from "../../store/slices/userSlice";

export default function AddReviewScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const user = useSelector(selectUser);
  const { orderId, productId, productName, productImage, restaurantId, driverId, driverName } =
    useLocalSearchParams();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast("Please give a rating.");
      return;
    }

    try {
      // Convert restaurantId to a valid ObjectId format if it's invalid
      // MongoDB ObjectIds are 24 hex characters
      const validRestaurantId = restaurantId && restaurantId.length === 24
        ? restaurantId
        : "000000000000000000000001"; // Default placeholder ObjectId

      // If driverId provided, use it.
      const validDriverId = driverId && driverId.length === 24 ? driverId : null;

      await dispatch(
        addReview({
          orderId,
          restaurantId: validRestaurantId,
          driverId: validDriverId, // Pass driverId
          productId,
          productName: driverName || productName, // Use driver name if available
          rating,
          comment,
          image: productImage,
          userName: user?.name || user?.phone || "Anonymous",
          userImage: user?.image,
          verified: true,
        })
      ).unwrap();

      showToast("Review submitted successfully!");
      router.back();
    } catch (error) {
      console.error("Failed to submit review:", error);
      showToast(error?.message || "Failed to submit review. Please try again.");
    }
  };

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: "#F3F4F6", justifyContent: "center", padding: 20 },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            maxWidth: 600,
            width: "100%",
            alignSelf: "center",
            backgroundColor: "#fff",
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
            overflow: "hidden",
            maxHeight: "90%",
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Write a Review</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.content}>
            <Text style={styles.question}>
              How was {driverName ? "your delivery partner?" : `your ${productName}?`}
            </Text>
            <Text style={styles.subQuestion}>
              {driverName
                ? `Rate ${driverName}'s service.`
                : "Your feedback helps others make better choices."}
            </Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={40}
                    color={star <= rating ? "#FFD700" : "#ccc"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, { outlineStyle: "none" }]}
                placeholder="Write your experience..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Write a Review</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.content}>
            <Text style={styles.question}>
              How was {driverName ? "your delivery partner?" : `your ${productName}?`}
            </Text>
            <Text style={styles.subQuestion}>
              {driverName
                ? `Rate ${driverName}'s service.`
                : "Your feedback helps others make better choices."}
            </Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={40}
                    color={star <= rating ? "#FFD700" : "#ccc"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Write your experience..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "Poppins_600SemiBold",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  question: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
  },
  subQuestion: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 32,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 40,
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    marginBottom: 24,
  },
  textInput: {
    height: 120,
    fontSize: 16,
    color: "#333",
    fontFamily: "Poppins_400Regular",
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#FC8019", // Swiggy Orange
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#FC8019",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Poppins_600SemiBold",
  },
});
