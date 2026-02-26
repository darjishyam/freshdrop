const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http"); // Import http
const { Server } = require("socket.io"); // Import Socket.io
const path = require("path"); // Import path module

dotenv.config();

const app = express();
const server = http.createServer(app); // Create HTTP server

// Initialize Socket.io
// v1.0
// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  }
});

// Make io accessible globally or via req
app.set("io", io);

const { sendPushNotification } = require("./services/notificationService");
const { getDistanceFromLatLonInKm } = require("./services/locationService");
const Order = require("./models/Order");

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinDriverRoom", (driverId) => {
    socket.join(`driver_${driverId}`);
    console.log(`Driver ${driverId} joined room driver_${driverId}`);
  });

  socket.on("joinCityRoom", (city) => {
    if (!city) return;
    const normalizedCity = city.toLowerCase().trim().replace(/\s+/g, '_');
    socket.join(`city_${normalizedCity}`);
    console.log(`Socket ${socket.id} joined city room: city_${normalizedCity}`);
  });

  // NEW: Restaurant Room
  socket.on("joinRestaurantRoom", (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
    console.log(`Socket ${socket.id} joined restaurant room: restaurant_${restaurantId}`);
  });

  // NEW: User Room (for notifications and kicks)
  socket.on("joinUserRoom", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined user room: user_${userId}`);
  });

  // NEW: Admin Room
  socket.on("joinAdminRoom", () => {
    socket.join("admin_room");
    console.log(`Socket ${socket.id} joined Admin Room`);
  });

  socket.on("updateDriverLocation", async (data) => {
    // data: { driverId, latitude, longitude, address }
    const { driverId, latitude, longitude } = data;

    if (!driverId || !latitude || !longitude) return;

    // Broadcast to Admin Panel for real-time tracking
    io.to("admin_room").emit("driverLocationUpdated", {
      driverId,
      latitude,
      longitude,
      timestamp: new Date()
    });

    try {
      // 1. Find ACTIVE order for this driver (Out for Delivery)
      // We only care if they are delivering
      const activeOrder = await Order.findOne({
        driver: driverId,
        status: "Out for Delivery",
        "deliveryAddress.lat": { $exists: true },
        "deliveryAddress.lon": { $exists: true }
      }).populate("user"); // Populate user to get their ID for notification

      if (activeOrder) {
        const customerLat = activeOrder.deliveryAddress.lat;
        const customerLon = activeOrder.deliveryAddress.lon;

        const distanceKm = getDistanceFromLatLonInKm(latitude, longitude, customerLat, customerLon);
        const distanceMeters = distanceKm * 1000;

        console.log(`Driver ${driverId} is ${distanceMeters.toFixed(0)}m from Customer for Order ${activeOrder._id}`);

        // ✅ NEW: Relay live driver location to the USER's socket room so their map updates in real-time
        if (activeOrder.user) {
          const userId = activeOrder.user._id || activeOrder.user;
          const etaMinutes = Math.ceil((distanceKm / 30) * 60); // Assuming avg 30 km/h
          io.to(`user_${userId}`).emit("driverLocationUpdate", {
            orderId: activeOrder._id,
            latitude,
            longitude,
            distanceKm: distanceKm.toFixed(2),
            etaMinutes: Math.max(1, etaMinutes),
          });
        }

        // 2. Check Thresholds and Send Notifications
        let alertSent = false;
        let alertType = "";

        // Check 100m first (Priority)
        if (distanceMeters <= 100 && !activeOrder.proximityAlerts["100m"]) {
          alertType = "100m";
          await sendPushNotification(
            [{ userId: activeOrder.user._id, pushToken: activeOrder.user.pushToken }],
            "Order Arriving!",
            "Your delivery partner is just 100 meters away!",
            { orderId: activeOrder._id, type: "ORDER_UPDATE" },
            "User"
          );

          activeOrder.proximityAlerts["100m"] = true;
          alertSent = true;
        }

        // Check 500m (If 100m wasn't just sent)
        else if (distanceMeters <= 500 && !activeOrder.proximityAlerts["500m"] && !activeOrder.proximityAlerts["100m"]) {
          alertType = "500m";
          // We need to get the user's push token. 
          // Option A: Populate 'user' and access 'pushToken' field (if it exists on User model)
          // Option B: Use NotificationService to look it up (it doesn't seem to have lookup logic built-in based on previous file view)

          // Let's assume User model has pushToken. 
          // If not, we might need to fetch it.
          // Code below assumes activeOrder.user is the User document.
          if (activeOrder.user && activeOrder.user.pushToken) {
            await sendPushNotification(
              [{ userId: activeOrder.user._id, pushToken: activeOrder.user.pushToken }],
              "Order Nearby!",
              "Your delivery partner is within 500 meters.",
              { orderId: activeOrder._id, type: "ORDER_UPDATE" },
              "User"
            );
            activeOrder.proximityAlerts["500m"] = true;
            alertSent = true;
          } else {
            console.log("User push token not found for geofencing.");
          }
        }

        if (alertSent) {
          await activeOrder.save();
          console.log(`[Geofencing] Sent ${alertType} alert for Order ${activeOrder._id}`);
        }
      }

    } catch (error) {
      console.error("Error in updateDriverLocation:", error);
    }
  });


  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase payload limit
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    const bodyStr = JSON.stringify(req.body);
    const logBody = bodyStr.length > 200 ? bodyStr.substring(0, 200) + "..." : bodyStr;
    console.log(`Payload: ${logBody}`);
  }
  next();
});

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("FreshDrop Unified Backend is running");
});

// Routes
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const externalRoutes = require("./routes/externalRoutes");
const locationRoutes = require("./routes/locationRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const orderRoutes = require("./routes/orderRoutes");
const driverRoutes = require("./routes/driverRoutes"); // Import Driver Routes

app.use("/api/auth", authRoutes);
app.use("/api/restaurant-auth", require("./routes/restaurantAuthRoutes")); // New Restaurant Auth
app.use("/api/reviews", reviewRoutes);
app.use("/api/external", externalRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/menu", require("./routes/menuRoutes")); // New Menu Routes // New Product Routes
app.use("/api/admin", require("./routes/adminRoutes")); // Admin Routes

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    // Use server.listen instead of app.listen for Socket.io
    server.listen(PORT, "0.0.0.0", () => console.log(`Server started on port ${PORT}`));
  } catch (error) {
    console.error(
      "Failed to start server due to DB connection error:",
      error.message
    );
    process.exit(1);
  }
};

startServer();
