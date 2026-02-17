import { API_BASE_URL } from "../constants/api";

const SOCKET_URL = API_BASE_URL;

class SocketService {
    listeners = []; // Queue for listeners before connection

    constructor() {
        console.log("User App SocketService Initialized with Listener Queue");
    }

    connect = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");

            if (this.socket?.connected) return;

            this.socket = io(SOCKET_URL, {
                transports: ["websocket"],
                query: { token },
            });

            this.socket.on("connect", () => {
                console.log("User Socket connected:", this.socket.id);
                // Attach queued listeners
                this.listeners.forEach(({ event, callback }) => {
                    this.socket.on(event, callback);
                });
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
        // Always store in queue/list so we can re-attach if needed or attach later
        this.listeners.push({ event, callback });

        if (this.socket) {
            this.socket.on(event, callback);
        }
    };

    off = (event, callback) => {
        // Remove from local list
        this.listeners = this.listeners.filter(l => l.event !== event);

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
