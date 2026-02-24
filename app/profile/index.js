import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { clearCart, selectCartCount } from "../../store/slices/cartSlice";
import { selectUser, updateUser, clearUser } from "../../store/slices/userSlice";
import * as authService from "../../services/authService";
import { sendPushTokenToBackend, removePushTokenFromBackend } from "../../hooks/usePushNotifications";
import * as Notifications from "expo-notifications";

// Helper: mask phone number — e.g. 6355094294 → 63****294
const maskPhone = (phone) => {
  if (!phone || String(phone).length < 6) return phone;
  const p = String(phone);
  return p.slice(0, 2) + "****" + p.slice(-3);
};

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);

  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(user.name || "");
  const [tempPhone, setTempPhone] = useState(user.phone || "");
  const [tempEmail, setTempEmail] = useState(user.email || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load saved notification preference
  useEffect(() => {
    AsyncStorage.getItem("notificationsEnabled").then((val) => {
      if (val !== null) setNotificationsEnabled(val === "true");
    });
  }, []);

  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem("notificationsEnabled", String(value));

    if (value) {
      // Re-enable: get the Expo push token and save it to backend
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        if (tokenData?.data) {
          await sendPushTokenToBackend(tokenData.data);
        }
      } catch (e) {
        console.error("Could not re-register push token:", e);
      }
    } else {
      // Disable: remove push token from backend so no notifications are sent
      await removePushTokenFromBackend();
    }
  };

  const handleSave = () => {
    dispatch(updateUser({ name: tempName, phone: tempPhone, email: tempEmail }));
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      // --- NEW: Clear push token from backend ---
      await removePushTokenFromBackend();

      dispatch(clearCart());
      await authService.logoutUser();
      dispatch(logout());
      dispatch(clearUser());
      if (Platform.OS === "web") {
        window.location.href = "/auth/login";
      } else {
        router.replace("/auth/login");
      }
    } catch (error) {
      console.error("Logout Error:", error);
      if (Platform.OS === "web") {
        window.location.href = "/auth/login";
      } else {
        router.replace("/auth/login");
      }
    }
  };

  // Grouped menu sections
  const menuSections = [
    {
      title: "Orders",
      items: [
        {
          id: "orders",
          title: "My Orders",
          subtitle: "Past orders & reorder",
          icon: "receipt-outline",
          color: "#3B82F6",
          action: () => router.push("/orders"),
        },
        {
          id: "cart",
          title: "My Cart",
          subtitle: cartCount > 0 ? `${cartCount} items pending` : "View your cart",
          icon: "cart-outline",
          color: "#FC8019",
          badge: cartCount > 0 ? cartCount : null,
          action: () => router.push("/cart"),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          id: "addresses",
          title: "Addresses",
          subtitle: "Manage delivery locations",
          icon: "location-outline",
          color: "#059669",
          action: () => router.push("/profile/addresses"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          title: "Help & Support",
          subtitle: "FAQs and Chat",
          icon: "headset-outline",
          color: "#8B5CF6",
          action: () => { },
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBackground}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Text>
            <TouchableOpacity style={styles.cameraIcon}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {isEditing ? (
              <>
                <View style={styles.editGroup}>
                  <Text style={styles.label}>FULL NAME</Text>
                  <TextInput
                    style={styles.inputField}
                    value={tempName}
                    onChangeText={setTempName}
                    placeholder="Enter your name"
                  />
                </View>
                <View style={styles.editGroup}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <TextInput
                    style={styles.inputField}
                    value={tempEmail}
                    onChangeText={setTempEmail}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.editGroup}>
                  <Text style={styles.label}>PHONE NUMBER</Text>
                  <TextInput
                    style={styles.inputField}
                    value={tempPhone}
                    onChangeText={setTempPhone}
                    placeholder="Phone"
                    keyboardType="phone-pad"
                  />
                </View>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSave}>
                  <Text style={styles.saveActionText}>Save Changes</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.displayName}>{user.name || "Guest User"}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={16} color="#666" style={{ marginRight: 6 }} />
                  <Text style={styles.infoText}>{user.email || "No email added"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color="#666" style={{ marginRight: 6 }} />
                  {/* 👇 Masked phone number */}
                  <Text style={styles.infoText}>{maskPhone(user.phone) || "+91 99999 99999"}</Text>
                  <TouchableOpacity
                    style={styles.showPhoneBtn}
                    onPress={() => { }}
                  >
                    <Ionicons name="eye-outline" size={14} color="#FC8019" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.editActionBtn}
                  onPress={() => {
                    setTempName(user.name || "");
                    setTempPhone(user.phone || "");
                    setTempEmail(user.email || "");
                    setIsEditing(true);
                  }}
                >
                  <Text style={styles.editActionText}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Grouped Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.menuContainer}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuRow,
                    idx === section.items.length - 1 && styles.menuRowLast,
                  ]}
                  onPress={item.action}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.color + "18" }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  {!!(item.badge && item.badge > 0) && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{String(item.badge)}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Notifications Toggle */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.menuContainer}>
            <View style={[styles.menuRow, styles.menuRowLast]}>
              <View style={[styles.menuIconBox, { backgroundColor: "#F59E0B18" }]}>
                <Ionicons name="notifications-outline" size={22} color="#F59E0B" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>Notifications</Text>
                <Text style={styles.menuSubtitle}>
                  {notificationsEnabled ? "Order updates enabled" : "Notifications off"}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: "#e5e7eb", true: "#FC801940" }}
                thumbColor={notificationsEnabled ? "#FC8019" : "#9ca3af"}
              />
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  headerBackground: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerBackBtn: {
    position: "absolute",
    left: 20,
    top: Platform.OS === "android" ? 40 : 20,
    zIndex: 10,
    padding: 8,
  },
  headerTitleText: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },

  // Profile Card
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "flex-start",
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.07)" },
      default: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
    }),
    marginBottom: 20,
    width: "100%",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FC801930",
    marginBottom: 16,
    position: "relative",
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#FC8019" },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FC8019",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  formContainer: { width: "100%", alignItems: "flex-start" },
  displayName: { fontSize: 20, fontWeight: "bold", color: "#1f2937", marginBottom: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  infoText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  showPhoneBtn: { marginLeft: 6, padding: 2 },
  editActionBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FC8019",
    backgroundColor: "#FFF7ED",
  },
  editActionText: { color: "#FC8019", fontWeight: "600", fontSize: 14 },

  // Edit Mode
  editGroup: { width: "100%", marginBottom: 12 },
  label: { fontSize: 11, fontWeight: "700", color: "#9ca3af", marginBottom: 4, letterSpacing: 0.5 },
  inputField: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
  },
  saveActionBtn: {
    backgroundColor: "#FC8019",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: "center",
    marginTop: 16,
  },
  saveActionText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // Grouped Sections
  sectionBlock: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0px 1px 4px rgba(0,0,0,0.05)" },
      default: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    }),
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: "600", color: "#1f2937" },
  menuSubtitle: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  badge: {
    backgroundColor: "#FC8019",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  // Logout
  logoutButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
  },
  logoutButtonText: { color: "#ef4444", fontWeight: "bold", fontSize: 14 },
});
