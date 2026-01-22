/**
 * Add Phone Number Screen
 * 
 * Shown after Google Sign-In if user doesn't have a phone number.
 * Collects phone number and updates user profile.
 */

import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Platform,
    ActivityIndicator,
    Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../store/slices/userSlice";
import { updateProfile } from "../../store/slices/authSlice";
import { validatePhone } from "../../utils/authUtils";

export default function AddPhoneScreen() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const user = useSelector(selectUser);

    const isPhoneValid = validatePhone(phoneNumber);

    const handlePhoneChange = (text) => {
        const cleaned = text.replace(/[^0-9]/g, "");
        setPhoneNumber(cleaned);
    };

    const handleSubmit = useCallback(async () => {
        if (!isPhoneValid) {
            Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
            return;
        }

        setIsLoading(true);
        try {
            // Update via API
            await dispatch(updateProfile({
                phone: user.email,
                updates: { phone: phoneNumber }
            })).unwrap();

            // CRITICAL: Update user_profile in AsyncStorage
            const AsyncStorage = require("@react-native-async-storage/async-storage").default;
            const currentProfile = await AsyncStorage.getItem("user_profile");
            if (currentProfile) {
                const profile = JSON.parse(currentProfile);
                profile.phone = phoneNumber;
                await AsyncStorage.setItem("user_profile", JSON.stringify(profile));
            }

            // Reload user data
            const { loadUserData } = require("../../store/slices/userSlice");
            await dispatch(loadUserData());

            // Check if user has location set
            const savedCoords = await AsyncStorage.getItem("user_location_coords");

            if (!savedCoords || savedCoords === "null") {
                console.log("User missing location, redirecting to addresses");
                router.replace("/profile/addresses");
            } else {
                router.replace("/home");
            }
        } catch (err) {
            Alert.alert("Update Failed", err || "Failed to update phone number");
        } finally {
            setIsLoading(false);
        }
    }, [phoneNumber, isPhoneValid, dispatch, user]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>One More Step!</Text>
                    <Text style={styles.headerSubtitle}>
                        Please add your phone number to complete your profile
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.countryCode}>+91</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={handlePhoneChange}
                            maxLength={10}
                            autoFocus
                        />
                    </View>
                    {phoneNumber.length > 0 && !isPhoneValid && (
                        <Text style={styles.errorText}>
                            Please enter a valid 10-digit number
                        </Text>
                    )}
                </View>

                <Pressable
                    style={[styles.button, (!isPhoneValid || isLoading) && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={!isPhoneValid || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Continue</Text>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Platform.OS === "web" ? "#f4f4f6" : "#fff",
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        marginBottom: 32,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#FC8019",
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        maxWidth: 300,
    },
    form: {
        marginBottom: 32,
        width: "100%",
        maxWidth: 400,
    },
    label: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
        fontWeight: "600",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FC8019",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: "#fff",
    },
    countryCode: {
        fontSize: 16,
        color: "#FC8019",
        marginRight: 12,
        fontWeight: "600",
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#333",
        height: "100%",
        ...Platform.select({ web: { outlineStyle: "none" } }),
    },
    button: {
        backgroundColor: "#FC8019",
        height: 56,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        maxWidth: 400,
        shadowColor: "#FC8019",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        ...Platform.select({ web: { cursor: "pointer" } }),
    },
    buttonDisabled: {
        backgroundColor: "#FCA55D",
        opacity: 0.6,
        shadowOpacity: 0,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    errorText: {
        color: "#ef4444",
        fontSize: 12,
        marginTop: 4,
    },
});
