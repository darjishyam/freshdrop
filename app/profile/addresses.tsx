import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
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
  selectLocationCoords,
  selectSavedAddresses,
  updateLocation,
  updateLocationCoords,
  updateLocationType,
  saveUserAddress,
  fetchSavedAddresses,
  deleteUserAddress,
} from "../../store/slices/userSlice";

export default function ManageAddressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const activeLocation = useSelector(selectLocation);
  const locationType = useSelector(selectLocationType);
  const locationCoords = useSelector(selectLocationCoords);
  const savedAddresses = useSelector(selectSavedAddresses);

  // UI State: 'list' | 'add'
  const [viewMode, setViewMode] = useState("list");

  // Form State
  const [address, setAddress] = useState("");
  const [type, setType] = useState("Home");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch user's saved addresses when screen opens
    dispatch(fetchSavedAddresses());
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please enable location permissions to use this feature.");
        setLoadingLocation(false);
        return;
      }

      setAddress("Locating current address...");

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;

      // Update Redux coords early for maps
      dispatch(updateLocationCoords({ latitude, longitude }));

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (reverseGeocode && reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          const plusCodeRegex = /^[A-Z0-9]{4}\+[A-Z0-9]{2,}/;
          const readableAddress = [
            addr.name && !plusCodeRegex.test(addr.name) ? addr.name : null,
            addr.street,
            addr.district || addr.subregion,
            addr.city || addr.region,
            addr.postalCode
          ].filter(Boolean).join(", ");

          if (readableAddress && readableAddress.length > 5) {
            setAddress(readableAddress);
            showToast("Location detected!");
            return;
          }
        }
      } catch (e) {
        console.warn("Expo reverseGeocode failed:", e);
      }

      // Fallback OSM
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`,
          { headers: { "User-Agent": "SwiggyCloneApp/1.0", "Accept-Language": "en" } }
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
            showToast("Address fetched from OpenStreetMap!");
            return;
          }
        }
      } catch (err) {
        console.warn("OSM error:", err);
      }

      setAddress("");
      showToast("Could not determine address. Please type it manually.");
    } catch (error) {
      console.error("Error getting location:", error);
      setAddress("");
      Alert.alert("Error", "Failed to access location. Please check settings.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSaveNewAddress = async () => {
    if (!address.trim()) {
      Alert.alert("Error", "Address cannot be empty");
      return;
    }

    setIsSaving(true);
    let finalCoords = locationCoords;

    // Optional: geocode the typed address if GPS wasn't used
    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const response = await fetch(geocodeUrl, { headers: { "User-Agent": "SwiggyCloneApp/1.0" } });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          finalCoords = { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }
      }
    } catch (error) {
      console.warn("Geocoding failed", error);
    }

    try {
      // 1. Save to backend and Redux array
      await dispatch(saveUserAddress({
        street: address,
        type: type,
        city: "City", // Extrapolated from OSM in production
        lat: finalCoords?.latitude,
        lon: finalCoords?.longitude
      })).unwrap();

      showToast("Address saved successfully!");

      // 2. Select it automatically
      dispatch(updateLocation(address));
      dispatch(updateLocationType(type));
      if (finalCoords) dispatch(updateLocationCoords(finalCoords));

      // 3. Return to list mode
      setAddress("");
      setType("Home");
      setViewMode("list");

    } catch (error) {
      showToast(error || "Failed to save address");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAddress = (savedItem) => {
    // Dispatch selected address to Redux so the Cart uses it
    dispatch(updateLocation(savedItem.street));
    dispatch(updateLocationType(savedItem.type));
    if (savedItem.lat && savedItem.lon) {
      dispatch(updateLocationCoords({ latitude: savedItem.lat, longitude: savedItem.lon }));
    }

    showToast(`Delivery location set to ${savedItem.type}`);

    if (params.isOnboarding === "true") {
      router.replace("/home");
    } else {
      router.back();
    }
  };

  const handleDeleteAddress = async (id) => {
    Alert.alert("Delete Address", "Are you sure you want to remove this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(deleteUserAddress(id)).unwrap();
            showToast("Address deleted");
          } catch (err) {
            showToast("Failed to delete address");
          }
        }
      }
    ]);
  };

  // ---------------------------------------------------------------------------
  // RENDER RENDERING RENDER RENDER RENDER RENDER RENDER
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: viewMode === "list" ? "My Addresses" : "Add New Address",
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
          headerTintColor: "#000",
          headerTitleStyle: { fontWeight: "bold" },
          headerShown: true,
          // Custom back button to handle "back to list" logic
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (viewMode === "add" && savedAddresses.length > 0) {
                  setViewMode("list");
                } else {
                  router.back();
                }
              }}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ========================================================= */}
        {/* VIEW 1: ADDRESS LIST */}
        {/* ========================================================= */}
        {viewMode === "list" && (
          <View style={styles.listContainer}>
            <TouchableOpacity
              style={styles.addNewBtn}
              onPress={() => setViewMode("add")}
            >
              <Ionicons name="add" size={24} color="#FC8019" />
              <Text style={styles.addNewBtnText}>Add New Address</Text>
            </TouchableOpacity>

            <Text style={styles.savedTitle}>Saved Addresses</Text>

            {savedAddresses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No saved addresses found</Text>
              </View>
            ) : (
              savedAddresses.map((item) => {
                // Check if this is the currently selected address in Redux
                const isActive = item.street === activeLocation && item.type === locationType;
                const iconName = item.type === "Work" ? "briefcase" : item.type === "Other" ? "location" : "home";

                return (
                  <TouchableOpacity
                    key={item._id}
                    style={[styles.addressItem, isActive && styles.addressItemActive]}
                    onPress={() => handleSelectAddress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.addressIconBox}>
                      <Ionicons name={iconName} size={24} color={isActive ? "#FC8019" : "#64748b"} />
                    </View>
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressType}>{item.type}</Text>
                      <Text style={styles.addressStreet} numberOfLines={2}>{item.street}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteAddress(item._id);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}


        {/* ========================================================= */}
        {/* VIEW 2: ADD NEW ADDRESS FORM */}
        {/* ========================================================= */}
        {viewMode === "add" && (
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
                <Text style={[styles.typeText, type === "Home" && styles.activeTypeText]}>Home</Text>
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
                <Text style={[styles.typeText, type === "Work" && styles.activeTypeText]}>Work</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, type === "Other" && styles.activeTypeBtn]}
                onPress={() => setType("Other")}
              >
                <Ionicons
                  name={type === "Other" ? "location" : "location-outline"}
                  size={20}
                  color={type === "Other" ? "#fff" : "#000"}
                />
                <Text style={[styles.typeText, type === "Other" && styles.activeTypeText]}>Other</Text>
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

            <TouchableOpacity
              style={styles.locationBtn}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#FC8019" />
              ) : (
                <Ionicons name="locate" size={20} color="#FC8019" />
              )}
              <Text style={styles.locationBtnText}>
                {loadingLocation ? "Locating..." : "Use Current Location"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveNewAddress}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>SAVE ADDRESS</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  scrollView: {
    width: "100%",
  },
  content: {
    width: "100%",
    maxWidth: 500,
    padding: 16,
    alignSelf: "center",
  },
  // --- LIST MODE STYLES ---
  listContainer: {
    flex: 1,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FC8019",
    borderStyle: "dashed",
    justifyContent: "center",
    marginBottom: 24,
    ...Platform.select({
      web: { cursor: "pointer" }
    })
  },
  addNewBtnText: {
    color: "#FC8019",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  savedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    color: "#94a3b8",
    fontSize: 16,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addressItemActive: {
    borderColor: "#FC8019",
    backgroundColor: "#fff8f5",
  },
  addressIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  addressInfo: {
    flex: 1,
  },
  addressType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  addressStreet: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 8,
  },

  // --- FORM MODE STYLES ---
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    gap: 12, // React Native 0.71+ supports gap
    flexWrap: "wrap",
  },
  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#dfe6e9",
    backgroundColor: "#fff",
  },
  activeTypeBtn: {
    backgroundColor: "#FC8019",
    borderColor: "#FC8019",
  },
  typeText: {
    marginLeft: 8,
    fontSize: 14,
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
    backgroundColor: "#fafafa",
    marginBottom: 16,
    color: "#2d3436",
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
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});
