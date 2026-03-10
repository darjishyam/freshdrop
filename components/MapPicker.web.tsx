import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

const MapPicker = ({ region }) => {
    return (
        <View style={styles.mapContainer}>
            <View style={styles.webPlaceholder}>
                <Ionicons name="map-outline" size={48} color="#94a3b8" />
                <Text style={styles.webText}>Map Preview (Mobile Only)</Text>
                {region && (
                    <Text style={styles.coordText}>
                        {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
                    </Text>
                )}
            </View>
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
        backgroundColor: "#f1f5f9",
    },
    webPlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    webText: {
        marginTop: 12,
        color: "#64748b",
        fontSize: 16,
        fontWeight: "600",
    },
    coordText: {
        marginTop: 4,
        color: "#94a3b8",
        fontSize: 12,
    },
});

export default MapPicker;
