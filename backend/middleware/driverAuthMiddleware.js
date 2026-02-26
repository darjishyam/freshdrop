const jwt = require("jsonwebtoken");
const Driver = require("../models/Driver");

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

            if (decoded.role !== "driver") {
                return res.status(401).json({ message: "Not authorized as a driver" });
            }

            // Get driver from the token
            req.user = await Driver.findById(decoded.id).select("-otp -otpExpires");

            if (!req.user) {
                return res.status(401).json({ message: "Driver not found" });
            }

            // Check if driver is suspended or blocked
            if (['SUSPENDED', 'BLOCKED'].includes(req.user.status)) {
                return res.status(403).json({
                    message: `Your driver account has been ${req.user.status.toLowerCase()}. Please contact support.`,
                    status: req.user.status
                });
            }

            // Block PENDING drivers from all routes except profile and logout
            const allowedForPending = ['/profile', '/logout'];
            const isAllowedPath = allowedForPending.some(path => req.path.includes(path));

            if (req.user.status === 'PENDING' && !isAllowedPath) {
                return res.status(403).json({
                    message: "Your documents are under review. You will be notified once approved by admin.",
                    status: "PENDING"
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
