const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        console.log(`[Auth] User lookup failed for ID: ${decoded.id}`);
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      console.log(`[Auth] Checking status for ${req.user.email || req.user.phone}: ${req.user.status}`);

      // Check if user is suspended (Case-insensitive check for extra safety)
      if (req.user.status && req.user.status.toUpperCase() === "SUSPENDED") {
        console.log(`[Auth] Access BLOCKED for suspended user: ${req.user.email || req.user.phone}`);
        return res.status(403).json({
          message: "Your account has been suspended. Please contact support."
        });
      }

      next();
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: "Not authorized" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };
