import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

// Safe import for expo-device
let Device = null;
try {
    Device = require('expo-device');
} catch (error) {
    console.warn("expo-device module not found.");
}

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Send the Expo push token to the backend so the server can
 * send notifications to this device.
 */
export const sendPushTokenToBackend = async (token) => {
    try {
        const authToken = await AsyncStorage.getItem('auth_token');
        if (!authToken || !token) return;

        await fetch(`${API_BASE_URL}/auth/push-token`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ pushToken: token }),
        });
        console.log('✅ Push token sent to backend successfully');
    } catch (error) {
        console.error('❌ Failed to send push token to backend:', error);
    }
};

/**
 * Remove push token from backend — called when user disables notifications.
 */
export const removePushTokenFromBackend = async () => {
    try {
        const authToken = await AsyncStorage.getItem('auth_token');
        if (!authToken) return;

        await fetch(`${API_BASE_URL}/auth/push-token`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        console.log('🔕 Push token removed from backend');
    } catch (error) {
        console.error('Failed to remove push token from backend:', error);
    }
};

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const [notificationResponse, setNotificationResponse] = useState(null);
    const notificationListener = useRef();
    const responseListener = useRef();

    async function registerForPushNotificationsAsync() {
        let token;

        const isDevice = Device ? Device.isDevice : true;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                alert('Failed to get push token for push notification!');
                return;
            }

            try {
                const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
                token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
                console.log("Expo Push Token:", token);
            } catch (e) {
                console.error("Error getting push token:", e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }

    useEffect(() => {
        // Check if user has notifications enabled before registering
        AsyncStorage.getItem('notificationsEnabled').then(async (val) => {
            // Default is enabled (null = first time = enabled)
            const isEnabled = val === null || val === 'true';

            if (isEnabled) {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    console.log('📱 Push Token Registered:', token);
                    setExpoPushToken(token);
                    // Automatically send token to backend
                    await sendPushTokenToBackend(token);
                }
            } else {
                console.log('🔕 Notifications are disabled by user preference.');
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("Notification Tapped:", response);
            setNotificationResponse(response);
        });

        return () => {
            if (notificationListener.current) notificationListener.current.remove();
            if (responseListener.current) responseListener.current.remove();
        };
    }, []);

    return { expoPushToken, notification, notificationResponse };
};
