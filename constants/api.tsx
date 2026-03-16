import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
    if (Platform.OS === 'web') {
        // Explicitly use 127.0.0.1 for web to avoid IPv6 Windows resolution issues
        return 'http://127.0.0.1:5000';
    }
    if (Constants.expoConfig?.hostUri) {
        return `http://${Constants.expoConfig.hostUri.split(':')[0]}:5000`;
    }
    return 'https://freshdrop-backend.onrender.com'; // Default for real device APK
};

export const SOCKET_URL = getBaseUrl();
export const API_BASE_URL = `${SOCKET_URL}/api`;
