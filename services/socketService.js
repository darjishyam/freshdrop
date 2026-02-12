import { io } from "socket.io-client";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Match the URL in utils/api.js or constants/api.js (if exists)
const getBaseUrl = () => {
    if (Platform.OS === "web") return "http://localhost:5000";
    return "http://10.102.43.131:5000"; // Unified Backend Port
};

const SOCKET_URL = getBaseUrl();

class SocketService {
    socket = null;

    connect = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken"); // or however token is stored in SwiggyClone

            if (this.socket?.connected) return;

            this.socket = io(SOCKET_URL, {
                transports: ["websocket"],
                query: { token },
            });

            this.socket.on("connect", () => {
                console.log("User Socket connected:", this.socket.id);
            });

            this.socket.on("disconnect", () => {
                console.log("User Socket disconnected");
            });

        } catch (error) {
            console.error("Socket Init Error:", error);
        }
    };

    disconnect = () => {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    };

    on = (event, callback) => {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    };

    off = (event) => {
        if (this.socket) {
            this.socket.off(event);
        }
    };
}

export default new SocketService();
