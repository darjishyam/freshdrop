import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/api";

const API_URL = API_BASE_URL;

const STORAGE_KEYS = {
    TOKEN: "auth_token",
};

/**
 * Fetch User Orders
 * GET /api/orders
 */
export const fetchUserOrders = async () => {
    try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        // If no token, user is guest or logged out
        if (!token) return [];

        const response = await fetch(`${API_URL}/orders`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        if (response.status === 401) {
            // Token invalid
            return [];
        }

        if (!response.ok) {
            throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

/**
 * Create New Order
 * POST /api/orders
 */
export const createNewOrder = async (orderData) => {
    try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

        if (!token) {
            throw new Error("You must be logged in to place an order");
        }

        const response = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to create order");
        }

        return data;
    } catch (error) {
        console.error("Error placing order:", error);
        throw error;
    }
};
