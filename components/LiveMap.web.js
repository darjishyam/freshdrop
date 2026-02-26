import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LiveMap = forwardRef(({ driverCoords, order, customStyles }, ref) => {
    return (
        <View style={[customStyles.map, { justifyContent: "center", alignItems: "center", backgroundColor: "#f3f4f6" }]}>
            <Ionicons name="map-outline" size={48} color="#9ca3af" />
            <Text style={{ marginTop: 12, color: "#4b5563", fontWeight: "600" }}>Map tracking available on mobile</Text>
            <Text style={{ marginTop: 4, color: "#6b7280", fontSize: 12 }}>Check your SwiggyClone app to track your driver.</Text>
        </View>
    );
});

export default LiveMap;
