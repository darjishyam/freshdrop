import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

declare var window: any;

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import MapPicker from "../../components/MapPicker";
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
  Keyboard,
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

  // Map & Search State
  const [mapRegion, setMapRegion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [accuracy, setAccuracy] = useState(null);

  useEffect(() => {
    // Fetch user's saved addresses when screen opens
    dispatch(fetchSavedAddresses() as any);

    // Initialize map region if coords exist
    if (locationCoords) {
      setMapRegion({
        ...locationCoords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  }, []);

  // Helper: Calculate distance in meters between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Check if coordinates match any saved address (within 50 meters)
  const checkForSavedMatch = (lat, lon) => {
    if (!savedAddresses || savedAddresses.length === 0) return null;

    const match = savedAddresses.find(addr => {
      const dist = calculateDistance(lat, lon, addr.lat, addr.lon);
      return dist < 50; // Match if within 50 meters
    });

    return match;
  };

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

      const { latitude, longitude, accuracy: posAccuracy } = currentLocation.coords;
      setAccuracy(posAccuracy);

      if (posAccuracy > 100) {
        showToast(`📍 Accuracy is low (${Math.round(posAccuracy)}m). Please adjust the pin.`);
      }

      const newCoords = { latitude, longitude };
      setMapRegion({
        ...newCoords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      // Update Redux coords early for maps
      dispatch(updateLocationCoords(newCoords));

      // --- LOCATION SNAPPING ---
      const savedMatch = checkForSavedMatch(latitude, longitude);
      if (savedMatch) {
        setAddress(savedMatch.street);
        setType(savedMatch.type);
        showToast(`Recognized as ${savedMatch.type}`);
        return;
      }

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
          const data = (await response.json()) as any;
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    Keyboard.dismiss();
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { "User-Agent": "SwiggyCloneApp/1.0" } }
      );
      const data = (await response.json()) as any;
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latFloat = parseFloat(lat);
        const lonFloat = parseFloat(lon);
        const newCoords = { latitude: latFloat, longitude: lonFloat };
        const newRegion = {
          ...newCoords,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(newRegion);

        // --- LOCATION SNAPPING ---
        const savedMatch = checkForSavedMatch(latFloat, lonFloat);
        if (savedMatch) {
          setAddress(savedMatch.street);
          setType(savedMatch.type);
          showToast(`Recognized as ${savedMatch.type}`);
        } else {
          setAddress(display_name);
        }

        dispatch(updateLocationCoords(newCoords));
        showToast("Location found!");
      } else {
        showToast("No locations found for this search.");
      }
    } catch (error) {
      console.error("Search error:", error);
      showToast("Search failed. Check your connection.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegionChangeComplete = async (region) => {
    // Only update if the distance moved is significant to avoid infinite loops or jitter
    setMapRegion(region);
    const { latitude, longitude } = region;

    // --- LOCATION SNAPPING ---
    const savedMatch = checkForSavedMatch(latitude, longitude);
    if (savedMatch) {
      setAddress(savedMatch.street);
      setType(savedMatch.type);
      dispatch(updateLocationCoords({ latitude, longitude }));
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`,
        { headers: { "User-Agent": "SwiggyCloneApp/1.0", "Accept-Language": "en" } }
      );

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data && data.display_name) {
          setAddress(data.display_name);
          dispatch(updateLocationCoords({ latitude, longitude }));
        }
      }
    } catch (err) {
      console.warn("Reverse geocode on drag failed:", err);
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
        const data = (await response.json()) as any;
        if (data && data.length > 0) {
          finalCoords = { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }
      }
    } catch (error) {
      console.warn("Geocoding failed", error);
    }

    try {
      // 1. Save to backend and Redux array
      await (dispatch(saveUserAddress({
        street: address,
        type: type,
        city: "City", // Extrapolated from OSM in production
        lat: finalCoords?.latitude,
        lon: finalCoords?.longitude
      } as any) as any)).unwrap();

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
    if (!id) {
      showToast("Error: Address ID not found");
      return;
    }

    const performDelete = async () => {
      try {
        console.log(`[ADDRESS] Deleting address with ID: ${id}`);
        await (dispatch(deleteUserAddress(id) as any)).unwrap();
        showToast("Address deleted");
      } catch (err) {
        console.error("[ADDRESS] Delete failed:", err);
        showToast("Failed to delete address");
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && (window as any).confirm("Are you sure you want to remove this address?")) {
        performDelete();
      }
      return;
    }

    Alert.alert("Delete Address", "Are you sure you want to remove this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: performDelete
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
                // Check for match: either exact state match OR GPS proximity match
                const isExactActive = item.street === activeLocation && item.type === locationType;

                // Cords proximity check (if available)
                const isProximityActive = locationCoords ?
                  calculateDistance(locationCoords.latitude, locationCoords.longitude, item.lat, item.lon) < 50 :
                  false;

                const isActive = isExactActive || isProximityActive;

                const iconName = item.type === "Work" ? "briefcase" :
                  item.type === "Other" ? "location" :
                    item.type === "Home" ? "home" : "map";

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
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.addressType}>{item.type}</Text>
                        {isActive && (
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
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
            {/* Search Bar */}
            <Text style={styles.label}>Search Your Location</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for area, street, landmark..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchIconBtn} onPress={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Map Picker */}
            <MapPicker
              region={mapRegion}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation={true}
            />

            {accuracy && accuracy > 100 && (
              <View style={styles.accuracyWarning}>
                <Ionicons name="warning" size={16} color="#b45309" />
                <Text style={styles.accuracyWarningText}>
                  Location may be inaccurate. Please adjust the pin.
                </Text>
              </View>
            )}

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
  activePill: {
    backgroundColor: "#FC8019",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  activePillText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
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
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dfe6e9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#fafafa",
  },
  searchIconBtn: {
    backgroundColor: "#FC8019",
    width: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  accuracyWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  accuracyWarningText: {
    color: "#b45309",
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "500",
  },
});
