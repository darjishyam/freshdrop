const Driver = require("../models/Driver");
const jwt = require("jsonwebtoken");
const sendSms = require("../utils/smsSender");
const sendEmail = require("../utils/emailSender");
const axios = require("axios");
const { sendPushNotification } = require("../services/notificationService");

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

        if (driver.status === "BLOCKED") {
            return res.status(403).json({ message: "Your account has been permanently blocked. Please contact support." });
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

            // Block blocked accounts permanently
            if (driver.status === "BLOCKED") {
                await driver.save();
                return res.status(403).json({ message: "Your account has been permanently blocked. Please contact support." });
            }

            // Block rejected accounts
            if (driver.status === "REJECTED") {
                await driver.save();
                return res.status(403).json({ message: "Your application has been rejected. Please contact support." });
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
                location: driver.location,
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
// @desc    Update Driver Details
// @route   PUT /api/driver/update-details
const updateDriverDetails = async (req, res) => {
    try {
        const driver = await Driver.findById(req.user.id);
        if (!driver) return res.status(404).json({ message: "Driver not found" });

        const { name, city, vehicleType, vehicleNumber, vehicleModel, language, email, address, latitude, longitude, bankDetails } = req.body;

        console.log(`📝 Update details for ${driver._id}:`, req.body);

        driver.name = name || driver.name;

        // Bank Details Update
        if (bankDetails) {
            driver.bankDetails = {
                accountNumber: bankDetails.accountNumber || driver.bankDetails?.accountNumber,
                ifscCode: bankDetails.ifscCode || driver.bankDetails?.ifscCode,
                holderName: bankDetails.holderName || driver.bankDetails?.holderName,
                bankName: bankDetails.bankName || driver.bankDetails?.bankName
            };
            driver.markModified('bankDetails');
        }

        // Safeguard: Ignore LOCATION (GeoJSON) updates if coordinates are (0, 0)
        // BUT allow city/address updates. This allows manual city fixes to work 
        // even if geocoding fails, while preventing invalid (0,0) GPS updates.
        driver.city = city || driver.city;
        driver.vehicleType = vehicleType || driver.vehicleType;
        driver.vehicleNumber = vehicleNumber || driver.vehicleNumber;
        driver.vehicleModel = vehicleModel || driver.vehicleModel;
        driver.language = language || driver.language;
        if (email) driver.email = email;

        // Update Location if provided AND not zeroed
        if (latitude !== undefined && longitude !== undefined && (latitude !== 0 || longitude !== 0)) {
            console.log(`📍 Updating driver location to [${longitude}, ${latitude}]`);
            driver.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
                address: address || driver.location?.address || ""
            };
        } else if (latitude === 0 && longitude === 0) {
            console.log("🛑 Skipping geospatial location update due to zero coordinates (City updated independently)");
            // Still update the address name if provided
            if (address && driver.location) {
                driver.location.address = address;
            }
        } else {
            console.log("⚠️ No location update (lat/lon missing)");
        }

        await driver.save();

        // Emit socket event for real-time updates
        const io = req.app.get("io");
        if (io) {
            io.to(`driver_${driver._id}`).emit("driver:update", {
                type: "PROFILE_UPDATE",
                data: driver
            });
            console.log(`📡 Emitted driver:update to driver_${driver._id}`);
        }

        res.json({
            message: "Details updated",
            driver: driver
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

        console.log(`📄 Document upload for driver ${driver.name} (${driver._id})`);
        console.log("Payload:", JSON.stringify(req.body, (key, value) => {
            if (typeof value === 'string' && value.length > 100) return value.substring(0, 50) + "..."; // Truncate base64
            return value;
        }));

        const { aadhaarFront, aadhaarBack, drivingLicenseUrl, rcUrl, profilePhoto, bankDetails } = req.body;

        // Initialize documents if undefined
        if (!driver.documents) {
            driver.documents = {};
        }

        // Explicitly set fields to avoid spread issues with Mongoose subdocs
        if (aadhaarFront) driver.documents.aadhaarFront = aadhaarFront;
        if (aadhaarBack) driver.documents.aadhaarBack = aadhaarBack;
        if (drivingLicenseUrl) driver.documents.drivingLicenseUrl = drivingLicenseUrl;
        if (rcUrl) driver.documents.rcUrl = rcUrl;

        // If using spread, use .toObject() if it exists to get plain object, but direct assignment is safer
        // driver.documents = { ...driver.documents, ...updates }; 

        driver.markModified('documents');

        if (profilePhoto) driver.profilePhoto = profilePhoto;
        if (bankDetails) {
            driver.bankDetails = bankDetails;
            driver.markModified('bankDetails');
        }

        if (driver.documents.drivingLicenseUrl && driver.documents.aadhaarFront) {
            if (driver.status === "onboarding" || driver.status === "REUPLOAD_REQUIRED") {
                driver.status = "PENDING";
            }
        }

        await driver.save();
        console.log("✅ Documents saved successfully");

        res.json({
            message: "Documents uploaded, verification pending",
            status: driver.status
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: error.message });
    }
};

const DriverSession = require("../models/DriverSession");
const Order = require("../models/Order");

// @desc    Get Driver Profile with Stats
// @route   GET /api/driver/profile
const getDriverProfile = async (req, res) => {
    try {
        const driver = await Driver.findById(req.user.id);
        if (driver) {

            // --- STATS CALCULATION ---
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // 1. Calculate Earnings & Orders (Aggregation) - No date filter in match for accuracy
            const statsAggregation = await Order.aggregate([
                {
                    $match: {
                        driver: driver._id,
                        status: "Delivered"
                    }
                },
                {
                    $project: {
                        deliveryFee: "$billDetails.deliveryFee",
                        updatedAt: 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        lifetimeEarnings: { $sum: "$deliveryFee" },
                        lifetimeOrders: { $count: {} },
                        monthEarnings: {
                            $sum: {
                                $cond: [{ $gte: ["$updatedAt", startOfMonth] }, "$deliveryFee", 0]
                            }
                        },
                        monthOrders: {
                            $sum: {
                                $cond: [{ $gte: ["$updatedAt", startOfMonth] }, 1, 0]
                            }
                        },
                        weekEarnings: {
                            $sum: {
                                $cond: [{ $gte: ["$updatedAt", startOfWeek] }, "$deliveryFee", 0]
                            }
                        },
                        weekOrders: {
                            $sum: {
                                $cond: [{ $gte: ["$updatedAt", startOfWeek] }, 1, 0]
                            }
                        },
                        todayEarnings: {
                            $sum: {
                                $cond: [{ $gte: ["$updatedAt", startOfToday] }, "$deliveryFee", 0]
                            }
                        },
                        todayOrders: {
                            $sum: {
                                $cond: [{ $gte: ["$updatedAt", startOfToday] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            const aggr = statsAggregation[0] || {
                todayEarnings: 0, todayOrders: 0,
                weekEarnings: 0, weekOrders: 0,
                monthEarnings: 0, monthOrders: 0,
                lifetimeEarnings: 0, lifetimeOrders: 0
            };

            // Sync Driver Model if out of sync - Use targeted update to avoid status regression
            if (driver.lifetimeEarnings !== aggr.lifetimeEarnings ||
                driver.totalOrders !== aggr.lifetimeOrders ||
                driver.walletBalance !== aggr.lifetimeEarnings) {

                await Driver.findByIdAndUpdate(driver._id, {
                    $set: {
                        lifetimeEarnings: aggr.lifetimeEarnings,
                        totalOrders: aggr.lifetimeOrders,
                        walletBalance: aggr.lifetimeEarnings
                    }
                });

                // Update local object for the response
                driver.lifetimeEarnings = aggr.lifetimeEarnings;
                driver.totalOrders = aggr.lifetimeOrders;
                driver.walletBalance = aggr.lifetimeEarnings;
            }

            // 2. Calculate Online Hours
            // Helper to get hours from sessions
            const getOnlineHours = async (fromDate, orderCountForPeriod) => {
                const sessions = await DriverSession.find({
                    driver: driver._id,
                    $or: [
                        { endTime: { $gte: fromDate } }, // Ended after fromDate
                        { endTime: null } // Still active
                    ]
                });

                let totalMs = 0;
                sessions.forEach(s => {
                    // Overlap calculation
                    const sEnd = s.endTime ? new Date(s.endTime) : new Date();
                    const sStart = new Date(s.startTime);

                    // Effective Start: Max(sStart, fromDate)
                    const effectiveStart = sStart > fromDate ? sStart : fromDate;

                    // If effective start is before end, add duration
                    if (effectiveStart < sEnd) {
                        totalMs += (sEnd - effectiveStart);
                    }
                });

                // FALLBACK: If 0 hours but we have orders, estimate 45 mins per order (Legacy Data Support)
                if (totalMs === 0 && orderCountForPeriod > 0) {
                    const estimatedMs = orderCountForPeriod * 45 * 60 * 1000;
                    const maxPossible = Date.now() - fromDate.getTime();
                    return (Math.min(estimatedMs, maxPossible) / (1000 * 60 * 60)).toFixed(1);
                }

                return (totalMs / (1000 * 60 * 60)).toFixed(1);
            };

            const todayHours = await getOnlineHours(startOfToday, aggr.todayOrders);
            const weekHours = await getOnlineHours(startOfWeek, aggr.weekOrders);
            const monthHours = await getOnlineHours(startOfMonth, aggr.monthOrders);

            console.log(`Stats (Today): ₹${aggr.todayEarnings}, ${aggr.todayOrders} orders, ${todayHours} hrs`);

            // New Stats Object & Bonus Calculation
            const bonusTiers = [
                { target: 5, reward: 50 },
                { target: 10, reward: 150 },
                { target: 20, reward: 400 }
            ];

            const currentDailyOrders = aggr.todayOrders || 0;
            let nextTier = bonusTiers.find(t => t.target > currentDailyOrders);
            let bonusProgress = nextTier ? (currentDailyOrders / nextTier.target) : 1;

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
                bankDetails: driver.bankDetails || {},
                token: generateToken(driver._id),
                isDetailsComplete: !!driver.name && driver.name !== "New Driver" && !!driver.city && !!driver.vehicleNumber,
                isDocsComplete: !!driver.documents && !!driver.documents.drivingLicenseUrl,
                documents: driver.documents,

                // New Stats Object
                stats: {
                    today: {
                        earnings: aggr.todayEarnings,
                        orders: aggr.todayOrders,
                        hours: todayHours
                    },
                    week: {
                        earnings: aggr.weekEarnings,
                        orders: aggr.weekOrders,
                        hours: weekHours
                    },
                    month: {
                        earnings: aggr.monthEarnings,
                        orders: aggr.monthOrders,
                        hours: monthHours
                    },
                    lifetime: {
                        earnings: driver.lifetimeEarnings || 0,
                        orders: driver.totalOrders || 0,
                        hours: "0" // Lifetime hours not tracked historically
                    },
                    // Incentive Data
                    incentives: {
                        dailyBonus: {
                            current: currentDailyOrders,
                            nextTarget: nextTier ? nextTier.target : null,
                            reward: nextTier ? nextTier.reward : 0,
                            progress: bonusProgress,
                            achievedTiers: bonusTiers.filter(t => t.target <= currentDailyOrders)
                        }
                    }
                }
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

        // Prevent Suspended drivers from going online
        if (newIsOnline && driver.status === "SUSPENDED") {
            return res.status(403).json({ message: "Your account is currently suspended. You cannot go online until the suspension is lifted." });
        }

        if (newIsOnline && !driver.isOnline) {
            // Going Online
            driver.isOnline = true;
            driver.onlineSessionStart = new Date(); // Legacy support

            // Create New Session
            const DriverSession = require("../models/DriverSession");
            await DriverSession.create({
                driver: driver._id,
                startTime: new Date()
            });
            console.log(`Driver ${driver._id} went ONLINE. Session started.`);

        } else if (!newIsOnline && driver.isOnline) {
            // Going Offline
            driver.isOnline = false;

            // Close Active Session
            const DriverSession = require("../models/DriverSession");
            const activeSession = await DriverSession.findOne({
                driver: driver._id,
                endTime: null
            }).sort({ startTime: -1 });

            if (activeSession) {
                activeSession.endTime = new Date();
                activeSession.duration = activeSession.endTime - activeSession.startTime;
                await activeSession.save();
                console.log(`Driver ${driver._id} went OFFLINE. Session closed. Duration: ${activeSession.duration}ms`);
            }
        }

        await driver.save();

        res.json({
            message: `Status updated to ${driver.isOnline ? "Online" : "Offline"}`,
            isOnline: driver.isOnline,
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
            // Enforce Uniqueness: Remove this token from any other driver
            await Driver.updateMany(
                { pushToken: pushToken, _id: { $ne: driver._id } },
                { $set: { pushToken: null } }
            );
            console.log(`🧹 Cleared stale push token from other drivers`);

            driver.pushToken = pushToken;
            await driver.save();
            console.log(`✅ Push token saved for driver: ${driver.name} (${driver._id})`);

            // Send Instant Feedback Notification
            try {
                await sendPushNotification(
                    [{ userId: driver._id, pushToken: pushToken }],
                    "Notifications Active! 🔔",
                    "You are now ready to receive delivery orders.",
                    { type: "SYSTEM" },
                    "Driver"
                );
            } catch (notifError) {
                console.error("Failed to send welcome notification:", notifError);
            }

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
