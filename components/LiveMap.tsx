import React, { forwardRef, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, UIManager } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, AnimatedRegion } from 'react-native-maps';
import { Ionicons } from "@expo/vector-icons";

interface LiveMapProps {
    driverCoords: { latitude: number; longitude: number } | null;
    order: any;
    customStyles?: any;
}

const LiveMap = forwardRef<MapView, LiveMapProps>(({ driverCoords, order, customStyles }, ref) => {
    const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
    const isFirstRender = useRef(true);

    // Create animated region for smooth driver marker transition
    const animatedDriverLocation = useRef(
        new AnimatedRegion({
            latitude: driverCoords?.latitude || 0,
            longitude: driverCoords?.longitude || 0,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
        })
    ).current;

    // Fetch routing coordinates from Open Source Routing Machine (OSRM)
    // to draw a path from the Restaurant -> Delivery Address
    useEffect(() => {
        if (!order.restaurant?.address?.coordinates || !order.deliveryAddress) return;

        const fetchRoute = async () => {
            try {
                const startLon = order.restaurant.address.coordinates.lon;
                const startLat = order.restaurant.address.coordinates.lat;
                const destLon = order.deliveryAddress.lon;
                const destLat = order.deliveryAddress.lat;

                // OSRM expects coordinates in 'longitude,latitude' format
                const url = `http://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${destLon},${destLat}?overview=full&geometries=geojson`;

                const response = await fetch(url);
                const data = (await response.json()) as any;

                if (data.routes && data.routes.length > 0) {
                    const coords = data.routes[0].geometry.coordinates.map((coord: any) => ({
                        latitude: coord[1],
                        longitude: coord[0]
                    }));
                    setRouteCoordinates(coords);
                }
            } catch (error) {
                console.error("Error fetching route from OSRM:", error);
            }
        };

        if (isFirstRender.current || routeCoordinates.length === 0) {
            fetchRoute();
            isFirstRender.current = false;
        }
    }, [order.restaurant, order.deliveryAddress]);

    // Animate driver marker smoothly when GPS updates
    useEffect(() => {
        if (driverCoords && animatedDriverLocation) {
            const toValue = {
                latitude: driverCoords.latitude,
                longitude: driverCoords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            };

            if (Platform.OS === 'android') {
                animatedDriverLocation.timing({
                    ...toValue,
                    toValue: toValue as any,
                    duration: 2000,
                    useNativeDriver: false // react-native-maps AnimatedRegion requires false
                }).start();
            } else {
                animatedDriverLocation.spring({
                    ...toValue,
                    toValue: toValue as any,
                    useNativeDriver: false
                }).start();
            }
        }
    }, [driverCoords]);

    if (!driverCoords) return null;

    // TEMPORARILY DISABLED to prevent "API Key Not Found" crash on Android.
    // The driver location updates still work via Socket and update the UI labels!
    return (
        <View style={[styles.map, styles.fallbackContainer]}>
            <View style={styles.fallbackHeader}>
                <Ionicons name="bicycle" size={32} color="#FC8019" />
                <Text style={styles.fallbackText}>Live Tracking Active</Text>
            </View>
            <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>Driver Location:</Text>
                <Text style={styles.statusValue}>
                    {driverCoords.latitude.toFixed(4)}, {driverCoords.longitude.toFixed(4)}
                </Text>
            </View>
            <Text style={styles.fallbackSub}>Tracking your order in real-time</Text>
        </View>
    );

    /* 
    return (
        <MapView
            ref={ref}
            style={mapStyle}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
                latitude: driverCoords.latitude,
                longitude: driverCoords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            }}
            userInterfaceStyle="light"
        >
            {/* Draw the Route Line (Restaurant to Customer) */ /*
{routeCoordinates.length > 0 && (
<Polyline
    coordinates={routeCoordinates}
    strokeColor="#8b5cf6" // A nice purple/pink line
    strokeWidth={4}
    lineDashPattern={[0]}
/>
)}

{/* Restaurant Marker */ /*
    {order.restaurant?.address?.coordinates && (
        <Marker
            coordinate={{
                latitude: order.restaurant.address.coordinates.lat,
                longitude: order.restaurant.address.coordinates.lon,
            }}
            title={order.restaurant?.name || "Restaurant"}
            pinColor="#fc1919"
            zIndex={1}
        />
    )}

    {/* Delivery Address Marker */ /*
    {order.deliveryAddress?.lat && (
        <Marker
            coordinate={{
                latitude: order.deliveryAddress.lat,
                longitude: order.deliveryAddress.lon,
            }}
            title="Your Location"
            pinColor="#22c55e"
            zIndex={1}
        />
    )}

    {/* Driver Marker - Animated sliding */ /*
    <Marker.Animated
        coordinate={animatedDriverLocation as any}
        title="Your Delivery Partner"
        description="On the way to you"
        anchor={{ x: 0.5, y: 0.5 }} // Center the icon
        zIndex={2}
    >
        <View style={customStyles?.driverMarker || styles.driverMarker}>
            <Text style={customStyles?.driverMarkerText || styles.driverMarkerText}>🛵</Text>
        </View>
    </Marker.Animated>
</MapView>
);
*/
});

const styles = StyleSheet.create({
    map: {
        width: "100%",
        height: 220,
    },
    driverMarker: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 6,
        borderWidth: 2,
        borderColor: "#FC8019",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    driverMarkerText: {
        fontSize: 20,
    },
    fallbackContainer: {
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        gap: 12,
    },
    fallbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    fallbackText: {
        color: "#1e293b",
        fontSize: 18,
        fontWeight: "700",
    },
    fallbackSub: {
        color: "#94a3b8",
        fontSize: 14,
        marginTop: 4,
    },
    statusBox: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    statusLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginBottom: 2,
    },
    statusValue: {
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    }
});

export default LiveMap;
