const Driver = require("../models/Driver");
const jwt = require("jsonwebtoken");
const sendSms = require("../utils/smsSender");
const sendEmail = require("../utils/emailSender");
const axios = require("axios");

const shouldLogOtp = () =>
    process.env.LOG_OTPS === "true" || process.env.NODE_ENV !== "production";

const generateToken = (id) => {
    return jwt.sign({ id, role: "driver" }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

// @desc    Initiate Login/Signup with Phone
// @route   POST /api/driver/login-otp
const loginDriverOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: "Phone number required" });

        const driver = await Driver.findOne({ phone });

        if (!driver) {
            return res.status(400).json({ message: "Driver not found. Please Join Us first." });
        }

        if (driver.status === "BLOCKED" || driver.status === "SUSPENDED") {
            return res.status(403).json({ message: `Account is ${driver.status}` });
        }

        await sendOtpInternal(driver, res, "login");
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Initiate Signup
// @route   POST /api/driver/signup-otp
const initiateSignupOtp = async (req, res) => {
    try {
        const { phone, city, name } = req.body;
        if (!phone || !name) return res.status(400).json({ message: "Phone and Name required" });

        if (/\d/.test(name)) {
            return res.status(400).json({ message: "Name cannot contain numbers" });
        }

        let driver = await Driver.findOne({ phone });

        if (driver) {
            return res.status(400).json({ message: "Driver already exists. Please Login." });
        } else {
            driver = await Driver.create({
                name,
                phone,
                city,
                status: "onboarding",
                isVerified: false
            });
        }

        await sendOtpInternal(driver, res, "signup");
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const sendOtpInternal = async (driver, res, type) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (shouldLogOtp()) {
        console.log("--------------------------------");
        console.log(`DRIVER OTP (${type.toUpperCase()}):`, otp);
        console.log("--------------------------------");
    }

    driver.otp = otp;
    driver.otpExpires = Date.now() + 10 * 60 * 1000;
    await driver.save();

    try {
        await sendSms(driver.phone, otp);
    } catch (e) {
        // console.error("SMS Send Failed", e);
    }

    res.json({
        message: `OTP sent via SMS`,
        phone: driver.phone,
        isNewUser: type === "signup",
        devOtp: otp, // Forced for testing
    });
};

// @desc    Verify OTP
// @route   POST /api/driver/verify-otp
const verifyDriverOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        const driver = await Driver.findOne({ phone });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        if (driver.otp === otp && driver.otpExpires > Date.now()) {
            driver.otp = undefined;
            driver.otpExpires = undefined;

            if (!driver.isVerified) {
                driver.isVerified = true;
            }

            if (driver.status === "BLOCKED" || driver.status === "SUSPENDED") {
                return res.status(403).json({ message: `Account is ${driver.status}` });
            }

            await driver.save();

            res.json({
                _id: driver._id,
                name: driver.name,
                phone: driver.phone,
                email: driver.email,
                city: driver.city,
                status: driver.status,
                profilePhoto: driver.profilePhoto,
                language: driver.language,
                vehicleType: driver.vehicleType,
                vehicleNumber: driver.vehicleNumber,
                vehicleModel: driver.vehicleModel,
                walletBalance: driver.walletBalance || 0,
                location: driver.location, // Return GeoJSON if needed
                token: generateToken(driver._id),
                isDetailsComplete: !!driver.name && driver.name !== "New Driver" && !!driver.city && !!driver.vehicleNumber,
                isDocsComplete: !!driver.documents && !!driver.documents.drivingLicenseUrl
            });
        } else {
            res.status(400).json({ message: "Invalid or expired OTP" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Driver Details
// @route   PUT /api/driver/update-details
const updateDriverDetails = async (req, res) => {
    try {
        const driver = await Driver.findById(req.user.id);
        if (!driver) return res.status(404).json({ message: "Driver not found" });

        const { name, city, vehicleType, vehicleNumber, vehicleModel, language, email, address, latitude, longitude } = req.body;

        driver.name = name || driver.name;
        driver.city = city || driver.city;
        driver.vehicleType = vehicleType || driver.vehicleType;
        driver.vehicleNumber = vehicleNumber || driver.vehicleNumber;
        driver.vehicleModel = vehicleModel || driver.vehicleModel;
        driver.language = language || driver.language;
        if (email) driver.email = email;

        // Update Location if provided
        if (latitude && longitude) {
            driver.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
                address: address || driver.location?.address || ""
            };
        }

        await driver.save();

        res.json({
            message: "Details updated",
            driver: {
                name: driver.name,
                city: driver.city,
                status: driver.status
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Driver Location (High Frequency)
// @route   PUT /api/driver/location
const updateDriverLocation = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: "Latitude and Longitude required" });
        }

        // Update GeoJSON location
        const updateData = {
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
                address: address || ""
            }
        };

        // If driver is active, also ensure they are marked online/reachable if we want
        // But for now just update coords.

        await Driver.findByIdAndUpdate(req.user.id, updateData);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Location Update Error", error);
        res.status(500).json({ message: "Failed to update location" });
    }
};

// @desc    Upload Documents
// @route   PUT /api/driver/upload-documents
const uploadDriverDocuments = async (req, res) => {
    try {
        const driver = await Driver.findById(req.user.id);
        if (!driver) return res.status(404).json({ message: "Driver not found" });

        const { aadhaarFront, aadhaarBack, drivingLicenseUrl, rcUrl, profilePhoto, bankDetails } = req.body;

        driver.documents = {
            ...driver.documents,
            aadhaarFront: aadhaarFront || driver.documents?.aadhaarFront,
            aadhaarBack: aadhaarBack || driver.documents?.aadhaarBack,
            drivingLicenseUrl: drivingLicenseUrl || driver.documents?.drivingLicenseUrl,
            rcUrl: rcUrl || driver.documents?.rcUrl
        };

        if (profilePhoto) driver.profilePhoto = profilePhoto;
        if (bankDetails) driver.bankDetails = bankDetails;

        if (driver.documents.drivingLicenseUrl && driver.documents.aadhaarFront) {
            if (driver.status === "onboarding" || driver.status === "REUPLOAD_REQUIRED") {
                driver.status = "PENDING";
            }
        }

        await driver.save();

        res.json({
            message: "Documents uploaded, verification pending",
            status: driver.status
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Driver Profile
// @route   GET /api/driver/profile
const getDriverProfile = async (req, res) => {
    try {
        const driver = await Driver.findById(req.user.id);
        if (driver) {
            console.log(`getDriverProfile: sending isOnline=${driver.isOnline}, todayOnlineDuration=${driver.todayOnlineDuration}`);
            res.json({
                _id: driver._id,
                name: driver.name,
                phone: driver.phone,
                email: driver.email,
                city: driver.city,
                status: driver.status,
                profilePhoto: driver.profilePhoto,
                language: driver.language,
                vehicleType: driver.vehicleType,
                vehicleNumber: driver.vehicleNumber,
                vehicleModel: driver.vehicleModel,
                walletBalance: driver.walletBalance || 0,
                lifetimeEarnings: driver.lifetimeEarnings || 0,
                totalOrders: driver.totalOrders || 0,
                rating: driver.rating || 0,
                ratingCount: driver.ratingCount || 0,
                isOnline: driver.isOnline,
                token: generateToken(driver._id),
                isDetailsComplete: !!driver.name && driver.name !== "New Driver" && !!driver.city && !!driver.vehicleNumber,
                isDocsComplete: !!driver.documents && !!driver.documents.drivingLicenseUrl,
                todayOnlineHours: (() => {
                    // Calculate Online Duration
                    let totalDuration = driver.todayOnlineDuration || 0;

                    // Reset if new day
                    if (driver.lastOnlineUpdate) {
                        const lastDate = new Date(driver.lastOnlineUpdate).getDate();
                        const todayDate = new Date().getDate();
                        if (lastDate !== todayDate) {
                            totalDuration = 0;
                            // Note: We can't save here effectively in a GET, 
                            // but the logic will correct itself on next status update or we assume 0 for display
                        }
                    }

                    // Add current session if online
                    if (driver.isOnline && driver.onlineSessionStart) {
                        const currentSession = Date.now() - new Date(driver.onlineSessionStart).getTime();
                        totalDuration += currentSession;
                    }
                    return (totalDuration / (1000 * 60 * 60)).toFixed(1);
                })()
            });
        } else {
            res.status(404).json({ message: "Driver not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Driver Status (Online/Offline)
// @route   PUT /api/driver/status
// @desc    Update Driver Status (Online/Offline)
// @route   PUT /api/driver/status
const updateDriverStatus = async (req, res) => {
    try {
        const { status, isOnline } = req.body;
        // Support both 'status' and 'isOnline' keys
        const statusValue = status !== undefined ? status : isOnline;

        let newIsOnline = false;
        if (typeof statusValue === 'boolean') {
            newIsOnline = statusValue;
        } else if (statusValue === 'online') {
            newIsOnline = true;
        } else if (statusValue === 'offline') {
            newIsOnline = false;
        }

        const driver = await Driver.findById(req.user.id);

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        if (driver.status !== "ACTIVE" && driver.status !== "PENDING") {
            // Optional: Block online if not active/verified
            // return res.status(403).json({ message: "Account is not active yet" });
        }

        // Handle Online Session Tracking
        // 1. Reset if new day
        if (driver.lastOnlineUpdate) {
            const lastDate = new Date(driver.lastOnlineUpdate).getDate();
            const todayDate = new Date().getDate();
            if (lastDate !== todayDate) {
                driver.todayOnlineDuration = 0;
                driver.onlineSessionStart = null;
            }
        }

        if (newIsOnline && !driver.isOnline) {
            // Going Online
            driver.isOnline = true;
            driver.onlineSessionStart = new Date();
        } else if (!newIsOnline && driver.isOnline) {
            // Going Offline
            driver.isOnline = false;
            if (driver.onlineSessionStart) {
                const sessionDuration = Date.now() - new Date(driver.onlineSessionStart).getTime();
                driver.todayOnlineDuration = (driver.todayOnlineDuration || 0) + sessionDuration;
                driver.onlineSessionStart = null;
            }
        }

        driver.lastOnlineUpdate = new Date();
        await driver.save();

        res.json({
            message: `Status updated to ${driver.isOnline ? "Online" : "Offline"}`,
            isOnline: driver.isOnline,
            todayOnlineHours: (driver.todayOnlineDuration / (1000 * 60 * 60)).toFixed(1)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Zones for City (OSM)
// @route   GET /api/driver/zones
const getCityZones = async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) return res.status(400).json({ message: "City is required" });

        const osmUrl = `https://nominatim.openstreetmap.org/search.php?city=${encodeURIComponent(city)}&format=json&featuretype=settlement&limit=10`;

        const response = await axios.get(osmUrl, {
            headers: { 'User-Agent': 'SwiggyDriverAppClone/1.0' }
        });

        let zones = [];

        if (response.data && response.data.length > 0) {
            zones = response.data.map(place => ({
                id: place.place_id ? String(place.place_id) : Math.random().toString(),
                name: place.name,
                dist: `${Math.floor(Math.random() * 10) + 2} kms`,
                bonus: String(4000 + Math.floor(Math.random() * 5) * 500)
            }));
            zones = zones.filter((v, i, a) => a.findIndex(v2 => (v2.name === v.name)) === i);
        } else {
            zones = [
                { id: "central", name: `${city} Central`, dist: "2 kms", bonus: "4500" },
                { id: "north", name: `${city} North`, dist: "5 kms", bonus: "4200" },
                { id: "south", name: `${city} South`, dist: "8 kms", bonus: "4000" },
            ];
        }

        res.json(zones);
    } catch (error) {
        console.error("OSM Error:", error.message);
        res.json([
            { id: "central", name: "Central Zone", dist: "2 kms", bonus: "4500" },
            { id: "east", name: "East Zone", dist: "5 kms", bonus: "4200" },
        ]);
    }
}

// @desc    Complete Order (Mock for Payment)
// @route   POST /api/driver/complete-order
const completeOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        const driver = await Driver.findById(req.user.id);

        if (!driver) return res.status(404).json({ message: "Driver not found" });

        const earnings = parseFloat(amount);
        if (isNaN(earnings)) return res.status(400).json({ message: "Invalid amount" });

        driver.walletBalance = (driver.walletBalance || 0) + earnings;
        driver.lifetimeEarnings = (driver.lifetimeEarnings || 0) + earnings;
        driver.totalOrders = (driver.totalOrders || 0) + 1;

        await driver.save();

        res.json({
            message: "Order completed",
            walletBalance: driver.walletBalance,
            totalOrders: driver.totalOrders
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Update Driver Push Token
// @route   PUT /api/driver/push-token
const updateDriverPushToken = async (req, res) => {
    try {
        const { pushToken } = req.body;

        console.log(`📱 Push token update request from driver ${req.user.id}`);
        console.log(`📱 Push token: ${pushToken}`);

        if (!pushToken) {
            return res.status(400).json({ message: "Push token is required" });
        }

        const driver = await Driver.findById(req.user.id);

        if (driver) {
            driver.pushToken = pushToken;
            await driver.save();
            console.log(`✅ Push token saved for driver: ${driver.name} (${driver._id})`);
            res.json({ message: "Push token updated" });
        } else {
            console.log(`❌ Driver not found: ${req.user.id}`);
            res.status(404).json({ message: "Driver not found" });
        }
    } catch (error) {
        console.error(`❌ Push token update error:`, error);
        res.status(500).json({ message: error.message });
    }
};

const Notification = require("../models/Notification");

// @desc    Get Driver Notifications
// @route   GET /api/driver/notifications
const getDriverNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user.id,
            recipientModel: 'Driver'
        }).sort({ createdAt: -1 });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark Notification as Read
// @route   PUT /api/driver/notifications/:id/read
const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        notification.read = true;
        await notification.save();

        res.json({ message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginDriverOtp,
    initiateSignupOtp,
    verifyDriverOtp,
    updateDriverDetails,
    updateDriverLocation,
    uploadDriverDocuments,
    getDriverProfile,
    updateDriverStatus,
    getCityZones,
    completeOrder,
    updateDriverPushToken,
    getDriverNotifications,
    markNotificationRead
};
