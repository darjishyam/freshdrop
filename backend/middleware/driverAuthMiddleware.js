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
