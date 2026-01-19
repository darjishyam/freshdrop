import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../context/ToastContext";
import {
  selectLocation,
  selectLocationType,
  updateLocation,
  updateLocationType,
} from "../../store/slices/userSlice";

export default function ManageAddressScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const location = useSelector(selectLocation);
  const locationType = useSelector(selectLocationType);

  // Local state for editing
  const [address, setAddress] = useState(location);
  const [type, setType] = useState(locationType);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Sync state with context when context changes (optional, but good for reliable init)
  useEffect(() => {
    setAddress(location);
    setType(locationType);
  }, [location, locationType]);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please enable location permissions to use this feature."
        );
        setLoadingLocation(false);
        return;
      }

      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;

      // Fetch Address from OpenStreetMap (Nominatim) - Force English
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`,
          {
            headers: {
              "User-Agent": "SwiggyCloneApp/1.0",
              "Accept-Language": "en",
            },
          }
        );

        if (!response.ok) throw new Error("OSM Fetch Failed");

        const data = await response.json();

        if (data && data.display_name) {
          setAddress(data.display_name);
          showToast("Address fetched from OpenStreetMap!");
        } else {
          setAddress(`${latitude}, ${longitude}`);
          showToast("Coordinates set (Address not found)");
        }
      } catch (err) {
        console.warn("OSM error:", err);
        // Fallback to Expo if network fails or OSM down?
        // Simplest fallback is coord
        setAddress(`${latitude}, ${longitude}`);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to access location. Please check settings.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = () => {
    if (!address.trim()) {
      Alert.alert("Error", "Address cannot be empty");
      return;
    }
    dispatch(updateLocation(address));
    dispatch(updateLocationType(type));
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Manage Address",
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false, // Cleaner look
          headerTintColor: "#000",
          headerTitleStyle: { fontWeight: "bold" },
          headerShown: true, // Ensure it is shown
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Address Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === "Home" && styles.activeTypeBtn]}
              onPress={() => setType("Home")}
            >
              <Ionicons
                name={type === "Home" ? "home" : "home-outline"}
                size={20}
                color={type === "Home" ? "#fff" : "#000"}
              />
              <Text
                style={[
                  styles.typeText,
                  type === "Home" && styles.activeTypeText,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, type === "Work" && styles.activeTypeBtn]}
              onPress={() => setType("Work")}
            >
              <Ionicons
                name={type === "Work" ? "briefcase" : "briefcase-outline"}
                size={20}
                color={type === "Work" ? "#fff" : "#000"}
              />
              <Text
                style={[
                  styles.typeText,
                  type === "Work" && styles.activeTypeText,
                ]}
              >
                Work
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Delivery Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            multiline
            placeholder="Enter your full address"
            textAlignVertical="top"
          />

          {/* Use Current Location Button */}
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={getCurrentLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#FC8019" />
            ) : (
              <Ionicons name="location" size={20} color="#FC8019" />
            )}
            <Text style={styles.locationBtnText}>
              {loadingLocation ? "Getting Location..." : "Use Current Location"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
    alignItems: "center", // Center content horizontally for web
    justifyContent: "center", // Center vertically if needed
  },
  // Removed custom header styles
  content: {
    width: "100%",
    maxWidth: 500, // Constrain width for web/tablets
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 15px rgba(0,0,0,0.08)",
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
      },
    }),
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    color: "#2d3436",
  },
  typeRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#dfe6e9",
    marginRight: 16,
    backgroundColor: "#fff",
  },
  activeTypeBtn: {
    backgroundColor: "#FC8019",
    borderColor: "#FC8019",
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 8px rgba(252, 128, 25, 0.3)",
      },
      default: {
        shadowColor: "#FC8019",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      },
    }),
  },
  typeText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#636e72",
  },
  activeTypeText: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dfe6e9",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: "#fff",
    marginBottom: 16,
    color: "#2d3436",
  },
  mapContainer: {
    height: 200,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#dfe6e9",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FC8019",
    backgroundColor: "#FFF5E6",
    marginBottom: 24,
    gap: 8,
  },
  locationBtnText: {
    color: "#FC8019",
    fontSize: 15,
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: "#FC8019",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 10px rgba(252, 128, 25, 0.4)",
      },
      default: {
        shadowColor: "#FC8019",
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      },
    }),
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});
