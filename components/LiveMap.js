import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const LiveMap = forwardRef(({ driverCoords, order, customStyles }, ref) => {
    if (!driverCoords) return null;

    return (
        <MapView
            ref={ref}
            style={customStyles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
                latitude: driverCoords.latitude,
                longitude: driverCoords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            }}
        >
            <Marker
                coordinate={driverCoords}
                title="Your Delivery Partner"
                description="On the way to you"
            >
                <View style={customStyles.driverMarker}>
                    <Text style={customStyles.driverMarkerText}>🛵</Text>
                </View>
            </Marker>

            {order.restaurant?.address?.coordinates && (
                <Marker
                    coordinate={{
                        latitude: order.restaurant.address.coordinates.lat,
                        longitude: order.restaurant.address.coordinates.lon,
                    }}
                    title={order.restaurant?.name || "Restaurant"}
                    pinColor="#FC8019"
                />
            )}

            {order.deliveryAddress?.lat && (
                <Marker
                    coordinate={{
                        latitude: order.deliveryAddress.lat,
                        longitude: order.deliveryAddress.lon,
                    }}
                    title="Your Location"
                    pinColor="#22c55e"
                />
            )}
        </MapView>
    );
});

export default LiveMap;
