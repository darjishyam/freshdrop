const jwt = require("jsonwebtoken");
const Restaurant = require("../models/Restaurant");

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            if (!token || token === "null" || token === "undefined") {
                return res.status(401).json({ message: "Not authorized, invalid token" });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get restaurant from the token
            req.user = await Restaurant.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "Restaurant not found" });
            }

            // Allow PENDING and APPROVED restaurants (Blocked: REJECTED, SUSPENDED)
            if (req.user.status === "REJECTED" || req.user.status === "SUSPENDED") {
                return res.status(403).json({
                    message: `Your restaurant account is ${req.user.status.toLowerCase()}. Please contact admin.`,
                    status: req.user.status
                });
            }

            next();
        } catch (error) {
            console.error("[RestaurantAuth] Error:", error.message);
            res.status(401).json({ message: "Not authorized" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

module.exports = { protect };
