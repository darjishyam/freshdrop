const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/external", require("./routes/externalRoutes"));
app.use("/api/location", require("./routes/locationRoutes"));
app.use("/api/restaurants", require("./routes/restaurantRoutes"));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (error) {
    console.error(
      "Failed to start server due to DB connection error:",
      error.message
    );
    process.exit(1);
  }
};

startServer();
