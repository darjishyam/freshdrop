import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../constants/api";

// Stripping '/api' from the base URL because Socket.io shouldn't connect to that namespace 
// unless specifically configured on the server.
const SOCKET_URL = API_BASE_URL.replace("/api", "");

class SocketService {
    listeners = []; // Queue for listeners before connection
    pendingRooms = []; // Rooms to join once connected

    constructor() {
        console.log("User App SocketService Initialized");
    }

    connect = async () => {
        try {
            const token = await AsyncStorage.getItem("auth_token");

            // If already connected, don't reconnect
            if (this.socket?.connected) {
                console.log("[Socket] Already connected:", this.socket.id);
                return;
            }

            // Destroy old socket if it exists but is not connected
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }

            this.socket = io(SOCKET_URL, {
                transports: ["websocket"],
                query: { token },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            this.socket.on("connect", () => {
                console.log("[Socket] User connected:", this.socket.id);

                // Re-attach all queued event listeners
                this.listeners.forEach(({ event, callback }) => {
                    this.socket.on(event, callback);
                });

                // Emit all pending room joins
                this.pendingRooms.forEach((roomId) => {
                    this.socket.emit("joinUserRoom", roomId);
                    console.log("[Socket] Joined pending room: user_" + roomId);
                });
            });

            this.socket.on("disconnect", (reason) => {
                console.log("[Socket] User disconnected:", reason);
            });

            this.socket.on("connect_error", (err) => {
                console.error("[Socket] Connection error:", err.message);
            });

        } catch (error) {
            console.error("[Socket] Init Error:", error);
        }
    };

    // Join a user room - works whether already connected or not
    joinUserRoom = (userId) => {
        if (!userId) return;

        // Add to pending rooms so we re-join on reconnect
        if (!this.pendingRooms.includes(userId)) {
            this.pendingRooms.push(userId);
        }

        // If already connected, emit immediately
        if (this.socket?.connected) {
            this.socket.emit("joinUserRoom", userId);
            console.log("[Socket] Immediately joined room: user_" + userId);
        } else {
            console.log("[Socket] Room queued for when connected: user_" + userId);
        }
    };

    disconnect = () => {
        this.pendingRooms = []; // Clear pending rooms on logout
        this.listeners = [];
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    };

    on = (event, callback) => {
        // Store in queue - this handles re-attaching after reconnect
        const exists = this.listeners.some(l => l.event === event && l.callback === callback);
        if (!exists) {
            this.listeners.push({ event, callback });
        }

        // Attach immediately if socket exists
        if (this.socket) {
            this.socket.on(event, callback);
        }
    };

    off = (event, callback) => {
        // Remove from local list
        this.listeners = this.listeners.filter(
            l => !(l.event === event && l.callback === callback)
        );

        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);
            } else {
                this.socket.off(event);
            }
        }
    };
}

export default new SocketService();
