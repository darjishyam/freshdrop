import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';

export const CartBar = () => {
    // Hidden as requested, moved to Profile screen
    return null;
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 1000,
    },
    dock: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 24, // Pill shape
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    dockItem: {
        flex: 1,
        flexDirection: 'row', // Side-by-side icon and label? Or stacked?
        // User said "compact component". Side-by-side inside the dock item looks good.
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: '#eee',
        marginHorizontal: 10,
    },
    iconContainer: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FC8019',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    dockLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
});
