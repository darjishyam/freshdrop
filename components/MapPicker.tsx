import React from 'react';
import { View, StyleSheet, Text, UIManager } from 'react-native';
import MapView from 'react-native-maps';
import { Ionicons } from "@expo/vector-icons";

const MapPicker = ({ region, onRegionChangeComplete, showsUserLocation }) => {
    // TEMPORARILY DISABLED to prevent "API Key Not Found" crash on Android.
    // Address search and GPS detection still work in the bar above!
    return (
        <View style={[styles.mapContainer, styles.fallbackContainer]}>
            <Ionicons name="location-outline" size={48} color="#FC8019" />
            <Text style={styles.fallbackText}>Location Mode: Search & GPS</Text>
            <Text style={styles.fallbackSub}>Type your address in the search bar above!</Text>
            {region && (
                <Text style={styles.coordText}>
                    📍 Selected: {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    mapContainer: {
        height: 250,
        width: "100%",
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        position: "relative",
    },
    fallbackContainer: {
        backgroundColor: "#f8fafc",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    fallbackText: {
        marginTop: 12,
        color: "#64748b",
        fontSize: 16,
        fontWeight: "700",
    },
    fallbackSub: {
        color: "#94a3b8",
        fontSize: 14,
        marginTop: 4,
    },
    coordText: {
        marginTop: 8,
        color: "#cbd5e1",
        fontSize: 12,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    markerFixed: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginLeft: -20,
        marginTop: -40,
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
    },
});

export default MapPicker;
