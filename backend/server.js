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
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  }
});

// Make io accessible globally or via req
app.set("io", io);

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
app.use("/api/reviews", reviewRoutes);
app.use("/api/external", externalRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/driver", driverRoutes); // Use Driver Routes

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
