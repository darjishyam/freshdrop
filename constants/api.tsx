import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
    if (__DEV__) {
        if (Platform.OS === 'web') return 'http://localhost:5000';
        if (Constants.expoConfig?.hostUri) {
            return `http://${Constants.expoConfig.hostUri.split(':')[0]}:5000`;
        }
        return 'http://192.168.1.7:5000'; // Manual fallback
    }
    // Production Render Backend
    return 'https://freshdrop-backend.onrender.com';
};

export const SOCKET_URL = getBaseUrl();
export const API_BASE_URL = `${SOCKET_URL}/api`;
