import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { clearCart, selectCartCount } from "../../store/slices/cartSlice";
import { selectUser, updateUser } from "../../store/slices/userSlice";

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);

  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(user.name || "");
  const [tempPhone, setTempPhone] = useState(user.phone || "");
  const [tempEmail, setTempEmail] = useState(user.email || "");

  const handleSave = () => {
    dispatch(
      updateUser({ name: tempName, phone: tempPhone, email: tempEmail })
    );
    setIsEditing(false);
  };

  const handleLogout = async () => {
    dispatch(clearCart());
    await dispatch(logout());
    router.replace("/auth/login");
  };

  const menuItems = [
    {
      id: "cart",
      title: "My Cart",
      subtitle: cartCount > 0 ? `${cartCount} items pending` : "View your cart",
      icon: "cart-outline",
      color: "#FC8019",
      badge: cartCount,
      action: () => router.push("/cart"),
    },
    {
      id: "orders",
      title: "My Orders",
      subtitle: "Past orders & reorder",
      icon: "receipt-outline",
      color: "#3B82F6",
      action: () => router.push("/orders"),
    },
    {
      id: "addresses",
      title: "Addresses",
      subtitle: "Manage delivery locations",
      icon: "location-outline",
      color: "#059669",
      action: () => router.push("/profile/addresses"),
    },
    {
      id: "help",
      title: "Help & Support",
      subtitle: "FAQs and Chat",
      icon: "headset-outline",
      color: "#333",
      action: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header Background */}
      <View style={styles.headerBackground}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>My Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
                <TouchableOpacity
                  style={styles.saveActionBtn}
                  onPress={handleSave}
                >
                  <Text style={styles.saveActionText}>Save Changes</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.displayName}>
                  {user.name || "Guest User"}
                </Text>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color="#666"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.infoText}>
                    {user.email || "No email added"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color="#666"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.infoText}>
                    {user.phone || "+91 99999 99999"}
                  </Text>
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

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuRow}
              onPress={item.action}
            >
              <View
                style={[
                  styles.menuIconBox,
                  { backgroundColor: item.color + "15" },
                ]}
              >
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              {item.badge && item.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerBackground: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
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
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "flex-start", // Align Left
    // Shadow
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.08)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
    marginBottom: 20,
    width: "100%",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#f9fafb",
    marginBottom: 16,
    position: "relative",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FC8019",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FC8019",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  formContainer: {
    width: "100%",
    alignItems: "flex-start", // Text Align Left
  },
  displayName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  editActionBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FC8019",
    backgroundColor: "#FFF7ED",
  },
  editActionText: {
    color: "#FC8019",
    fontWeight: "600",
    fontSize: 14,
  },
  editGroup: {
    width: "100%",
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  inputField: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10, // Tall input
    fontSize: 14,
    color: "#1f2937",
  },
  saveActionBtn: {
    backgroundColor: "#FC8019",
    paddingVertical: 12,
    paddingHorizontal: 32, // Auto width
    borderRadius: 12,
    alignSelf: "center", // Center it
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#FC8019",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveActionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    // Shadow
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.05)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#FC8019",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  logoutButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    paddingHorizontal: 32, // Auto width with padding
    borderRadius: 12,
    alignSelf: "center", // Center it
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 14,
  },
});
