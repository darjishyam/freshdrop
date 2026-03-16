import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
    // Production Render Backend
    return 'https://freshdrop-backend.onrender.com';
};

export const SOCKET_URL = getBaseUrl();
export const API_BASE_URL = `${SOCKET_URL}/api`;
