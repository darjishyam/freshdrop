import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/api";

let suspensionHandler = null;

/**
 * Global handler for suspension errors.
 * This is called whenever a 403 Suspended error is detected.
 */
export const setSuspensionHandler = (handler) => {
    suspensionHandler = handler;
};

/**
 * Centralized fetch wrapper to handle global concerns like:
 * - Automatically attaching auth tokens
 * - Intercepting 403 Suspended errors
 */
const request = async (endpoint, options = {}) => {
    const token = await AsyncStorage.getItem("auth_token");

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    // Ensure URL is absolute
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, config);

        // Check for 403 Forbidden (Suspension)
        if (response.status === 403) {
            // We need to clone the response to read it safely
            const clonedResponse = response.clone();
            const data = await clonedResponse.json();

            if (data.message && data.message.toLowerCase().includes("suspended")) {
                console.log("[apiClient] 403 Suspended detected!");
                if (suspensionHandler) {
                    suspensionHandler(data.message);
                }
                // Stop further execution for this request
                throw new Error("ACCOUNT_SUSPENDED");
            }
        }

        return response;
    } catch (error) {
        if (error.message === "ACCOUNT_SUSPENDED") {
            // Silently catch or handle if needed, but thunks will receive this
            throw error;
        }
        console.error("[apiClient] Network Error:", error);
        throw error;
    }
};

export default { request };
