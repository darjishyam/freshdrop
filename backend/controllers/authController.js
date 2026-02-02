const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sendSms = require("../utils/smsSender");
const sendEmail = require("../utils/emailSender");

const shouldLogOtp = () =>
  process.env.LOG_OTPS === "true" || process.env.NODE_ENV !== "production";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || (!email && !phone)) {
      return res
        .status(400)
        .json({ message: "Please provide Name and Email or Phone" });
    }

    // Check if user exists (by email or phone)
    const query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });

    if (query.length > 0) {
      const userExists = await User.findOne({ $or: query });
      if (userExists) {

        if (email && userExists.email === email)
          return res.status(400).json({ message: "User already exists" });
        if (phone && userExists.phone === phone)
          return res
            .status(400)
            .json({ message: "Phone number already exists" });
      }
    }

    let hashedPassword = undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const user = await User.create({
      name,
      email: email || undefined,
      phone: phone || undefined,
      password: hashedPassword,
    });

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      if (shouldLogOtp()) {
        console.log("--------------------------------");
        console.log("DEV OTP (SIGNUP):", otp);
        console.log("--------------------------------");
      }
      user.otp = otp;
      user.otpExpires = Date.now() + 30 * 1000; // 30 seconds
      await user.save();

      // Send OTP (Email or SMS)
      let sentType = "";

      if (user.email) {
        // ... (Keep existing Email sending logic)

        const brandingColor = "#FC8019";
        const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FreshDrop</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333;">Welcome <strong>${user.name
          }</strong>! 🛒</p>
            <p style="font-size: 16px; color: #555;">To complete your registration at FreshDrop, here is your <strong>Sign Up Code</strong>:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: ${brandingColor};">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #777;">This code is valid for 30 seconds.</p>
            <p style="font-size: 14px; color: #777; margin-top: 30px;">Happy Ordering!<br>The FreshDrop Team</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} FreshDrop. All rights reserved.
          </div>
        </div>
      `;

        try {
          // FIRE-AND-FORGET: Don't await email sending to prevent UI blocking
          sendEmail({
            email: user.email,
            subject: "FreshDrop Sign Up Code",
            message: `Your Sign Up OTP is ${otp}`,
            html: htmlContent,
          }).catch(err => console.error("Background Email Sending Error:", err));

          sentType = "email";
        } catch (emailError) {
          console.error("Failed to initiate email:", emailError);
        }
      }

      if (user.phone) {
        try {
          // TEMPORARILY DISABLED FOR SPEED
          // await sendSms(user.phone, otp);
          console.log("⚠️ SMS sending disabled for speed in signup.");
          sentType = sentType ? "email_and_sms" : "sms";
        } catch (smsError) {
          console.error("Failed to send SMS:", smsError);
        }
      }

      console.log("🔍 DEBUG - NODE_ENV:", process.env.NODE_ENV);
      console.log("🔍 DEBUG - LOG_OTPS:", process.env.LOG_OTPS);
      console.log("🔍 DEBUG - OTP value:", otp);

      const shouldIncludeOtp = process.env.LOG_OTPS === "true" || process.env.NODE_ENV === "development";
      console.log("🔍 DEBUG - shouldIncludeOtp:", shouldIncludeOtp);

      const response = {
        message: sentType ? `OTP sent to ${sentType}` : "OTP generated",
        email: user.email,
        phone: user.phone,
        devOtp: otp, // ALWAYS INCLUDE - FORCED FOR DEBUGGING
      };

      console.log("📤 Signup Response:", JSON.stringify(response, null, 2));
      res.status(201).json(response);
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  return res.status(400).json({ message: "Password login is disabled. Please use OTP login." });
  /* Deprecated logic below */
  try {
    const { email, password } = req.body;

    // Check if input is phone number (10 digits)
    const isPhoneInput = /^\d{10}$/.test(email);

    // Allow login with Email or Phone
    const user = await User.findOne({
      $or: [{ email: email }, { phone: email }],
    });

    if (!user) {
      // Specific error for Email not found
      return res.status(404).json({ message: "User not found" });
    }


    if (await bcrypt.compare(password, user.password)) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      if (shouldLogOtp()) {
        console.log("--------------------------------");
        console.log("DEV OTP (LOGIN):", otp);
        console.log("--------------------------------");
      }
      user.otp = otp;
      user.otpExpires = Date.now() + 30 * 1000; // 30 seconds
      await user.save();

      let sentType = "";

      // Only send email if input was NOT a phone number
      if (user.email && !isPhoneInput) {
        const brandingColor = "#FC8019";
        const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FreshDrop</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333;">Welcome back <strong>${user.name}</strong>!</p>
            <p style="font-size: 16px; color: #555;">To log in to your account, here is your <strong>Login Code</strong>:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: ${brandingColor};">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #777;">This code is valid for 30 seconds.</p>
          </div>
        </div>
      `;

        try {
          await sendEmail({
            email: user.email,
            subject: "FreshDrop Login Code",
            message: `Your Login OTP is ${otp}`,
            html: htmlContent,
          });
          sentType = "email";
        } catch (emailError) {
          console.error("Failed to send OTP email:", emailError);
        }
      }

      if (user.phone) {
        try {
          await sendSms(user.phone, otp);
          sentType = sentType ? "email_and_sms" : "sms";
        } catch (smsError) {
          console.error("Failed to send SMS:", smsError);
        }
      }

      res.json({
        message: `OTP sent to ${sentType}`,
        email: user.email,
        phone: user.phone,
        ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
      });
    } else {
      // Specific error for Incorrect Password
      res.status(401).json({ message: "Incorrect password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send OTP (Resend)
// @route   POST /api/auth/otp/send
const sendOtp = async (req, res) => {
  try {
    const { email, phone, type } = req.body;
    const identifier = email || phone;
    const isPhoneInput = /^\d{10}$/.test(identifier); // Check if input is a 10-digit phone number

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    if (shouldLogOtp()) {
      console.log("--------------------------------");
      console.log("DEV OTP (RESEND):", otp);
      console.log("--------------------------------");
    }
    user.otp = otp;
    user.otpExpires = Date.now() + 30 * 1000; // 30 seconds
    await user.save();

    let sentType = "";

    // Email OTP:
    // - If request is email-based => send email
    // - If request is phone-based BUT user has email => also send email (useful in dev when SMS is mocked)
    if (user.email && (Boolean(email) || isPhoneInput || Boolean(phone))) {
      const brandingColor = "#FC8019";
      let subject = "FreshDrop Verification Code";
      let bodyText = "Your One-Time Password (OTP) for FreshDrop is:";

      if (type === "signup") {
        subject = "FreshDrop Sign Up Code";
        bodyText =
          "To complete your registration, here is your <strong>Sign Up Code</strong>:";
      } else if (type === "login") {
        subject = "FreshDrop Login Code";
        bodyText =
          "To log in to your account, here is your <strong>Login Code</strong>:";
      } else if (type === "forgot-password") {
        subject = "FreshDrop Password Reset Code";
        bodyText =
          "To reset your password, here is your <strong>Reset Code</strong>:";
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FreshDrop</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333;">Hello <strong>${user.name
        }</strong>,</p>
            <p style="font-size: 16px; color: #555;">${bodyText}</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: ${brandingColor};">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #777;">This code is valid for 30 seconds. Please do not share this code with anyone.</p>
            <p style="font-size: 14px; color: #777; margin-top: 30px;">Happy Ordering!<br>The FreshDrop Team</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} FreshDrop. All rights reserved.
          </div>
        </div>
      `;

      try {
        // FIRE-AND-FORGET: Don't await the email
        sendEmail({
          email: user.email,
          subject: subject,
          message: `Your OTP is ${otp}`,
          html: htmlContent,
        }).catch(err => console.error("Background Email Sending Error:", err));

        sentType = "email";
      } catch (emailError) {
        console.error("Failed to initiate email:", emailError);
      }
    }

    if (user.phone) {
      try {
        // TEMPORARILY DISABLED FOR SPEED
        // await sendSms(user.phone, otp);
        console.log("⚠️ SMS sending disabled for speed.");
        sentType = sentType ? "email_and_sms" : "sms";
      } catch (smsError) {
        console.error("Failed to send SMS:", smsError);
      }
    }

    const shouldIncludeOtp = process.env.LOG_OTPS === "true" || process.env.NODE_ENV === "development";

    res.json({
      message: `OTP sent to ${sentType}`,
      email: user.email,
      phone: user.phone,
      devOtp: otp, // ALWAYS INCLUDE - FORCED FOR DEBUGGING
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/otp/verify
const verifyOtp = async (req, res) => {
  try {
    const { email, otp, phone } = req.body;
    const identifier = email || phone;

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP Logic
    const isOtpMatching =
      user.otp && user.otp.toString().trim() === otp.toString().trim();

    if (isOtpMatching) {
      if (user.otpExpires > Date.now()) {
        // Success: Matching and Valid
        // Clear OTP after successful use
        user.otp = undefined;
        user.otpExpires = undefined;

        // Check if first-time verification for Welcome Email
        if (!user.isVerified) {
          user.isVerified = true;
          // Send Welcome Email
          if (user.email) {
            const brandingColor = "#FC8019";
            const htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FreshDrop</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                  <p style="font-size: 16px; color: #333;">Welcome <strong>${user.name
              }</strong>! 🛒</p>
                  <p style="font-size: 16px; color: #555;">Thank you for verifying your account!</p>
                  <p style="font-size: 14px; color: #777; margin-top: 20px;">You can now explore thousands of products and order instantly.</p>
                  <p style="font-size: 14px; color: #777; margin-top: 30px;">Happy Ordering!<br>The FreshDrop Team</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                  &copy; ${new Date().getFullYear()} FreshDrop. All rights reserved.
                </div>
              </div>
            `;
            try {
              await sendEmail({
                email: user.email,
                subject: "Welcome to FreshDrop!",
                message:
                  "Welcome to FreshDrop! Your account has been verified.",
                html: htmlContent,
              });
            } catch (emailError) {
              console.error("Failed to send welcome email:", emailError);
            }
          }
        } else {
          // Already verified: Send "Welcome Back" email
          if (user.email) {
            const brandingColor = "#FC8019";
            const htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FreshDrop</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                  <p style="font-size: 16px; color: #333;">Welcome Back <strong>${user.name
              }</strong>! 👋</p>
                  <p style="font-size: 16px; color: #555;">You have successfully logged in.</p>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 14px; color: #555;">${new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            `;
            try {
              await sendEmail({
                email: user.email,
                subject: "Login Notification - FreshDrop",
                message: "You have successfully logged in.",
                html: htmlContent,
              });
            } catch (emailError) {
              console.error(
                "Failed to send Login Notification email:",
                emailError,
              );
            }
          }
        }

        await user.save();

        res.json({
          _id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          token: generateToken(user.id),
          message: "OTP Verified Login Success",
          isNewUser: !user.isVerified, // Flag for frontend navigation
        });
      } else {
        // Matching but Expired
        res.status(400).json({ message: "OTP has expired. Please resend." });
      }
    } else {
      // Not matching
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google Login/Signup
// @route   POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    // 1. Get token from frontend
    const { token, action } = req.body; // action: 'login' or 'signup'

    // 2. Verify ID TOKEN (Native) with Google
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );
    const googleUser = await response.json();
    console.log("Google Token Verification Response:", googleUser);

    if (!googleUser.email) {
      return res.status(400).json({ message: "Google authentication failed", details: googleUser });
    }

    // 3. Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    if (user) {

      // User exists - Update googleId/image if missing
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        await user.save();
      }

      // Re-fetch user from database to ensure we have the latest data (including phone if added later)
      const freshUser = await User.findById(user._id);

      // Send "Welcome Back" email for existing Google users
      if (freshUser.email) {
        const brandingColor = "#FC8019";
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FreshDrop</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
              <p style="font-size: 16px; color: #333;">Welcome Back <strong>${freshUser.name}</strong>! 👋</p>
              <p style="font-size: 16px; color: #555;">You have successfully logged in with Google.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 14px; color: #555;">${new Date().toLocaleString()}</span>
              </div>
              <p style="font-size: 14px; color: #777; margin-top: 30px;">Happy Ordering!<br>The FreshDrop Team</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
              &copy; ${new Date().getFullYear()} FreshDrop. All rights reserved.
            </div>
          </div>
        `;

        try {
          await sendEmail({
            email: freshUser.email,
            subject: "Login Notification - FreshDrop",
            message: "You have successfully logged in with Google.",
            html: htmlContent,
          });
        } catch (emailError) {
          console.error("Failed to send Google Login email:", emailError);
        }
      }

      // Return login response with fresh data
      res.json({
        _id: freshUser._id.toString(),
        name: freshUser.name,
        email: freshUser.email,
        phone: freshUser.phone, // Ensure phone is sent (will be present if added via modal)
        image: freshUser.image || googleUser.picture, // Use Google picture if no custom image
        token: generateToken(freshUser._id),
      });
    } else {
      // User does NOT exist

      // CHECK ACTION: If trying to LOGIN but user doesn't exist -> Error
      if (action === "login") {
        return res.status(404).json({
          message: "First sign up with Google",
          shouldRedirectToSignup: true,
        });
      }

      // 4. Create new user (Only if action is 'signup' or undefined)
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.sub,
        image: googleUser.picture,
        isVerified: true, // Google accounts are auto-verified
        // Phone and Password left empty
      });

      // SEND WELCOME EMAIL (Google Signup)
      const brandingColor = "#FC8019";
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FreshDrop</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333;">Welcome <strong>${user.name
        }</strong>! 🛒</p>
            <p style="font-size: 16px; color: #555;">Thank you for signing up with Google!</p>
            <p style="font-size: 14px; color: #777; margin-top: 20px;">You can now explore thousands of products and order instantly.</p>
            <p style="font-size: 14px; color: #777; margin-top: 30px;">Happy Ordering!<br>The FreshDrop Team</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
            &copy; ${new Date().getFullYear()} FreshDrop. All rights reserved.
          </div>
        </div>
      `;

      try {
        await sendEmail({
          email: user.email,
          subject: "Welcome to FreshDrop!",
          message:
            "Welcome to FreshDrop! Your account has been created via Google.",
          html: htmlContent,
        });
      } catch (emailError) {
        console.error("Failed to send Welcome email:", emailError);
      }

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone, // Include phone field (will be null for new users)
        image: user.image,
        token: generateToken(user.id),
        isNewUser: true,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get User Profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "recentlyViewed.restaurant",
      select: "name image address rating deliveryTime priceRange",
    });

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        googleId: user.googleId,
        image: user.image,
        recentlyViewed: user.recentlyViewed,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add restaurant to recently viewed
// @route   POST /api/auth/profile/history
// @access  Private
const addToHistory = async (req, res) => {
  try {
    const { restaurantId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove if already exists to avoid duplicates (we will add it to the top)
    user.recentlyViewed = user.recentlyViewed.filter(
      (item) => item.restaurant.toString() !== restaurantId
    );

    // Add to beginning
    user.recentlyViewed.unshift({ restaurant: restaurantId });

    // Limit to 10 items
    if (user.recentlyViewed.length > 10) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 10);
    }

    await user.save();
    res.json(user.recentlyViewed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update User Profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { _id, name, email, phone, image } = req.body;

    const user = await User.findById(_id);

    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.image = image || user.image;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        image: updatedUser.image,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP
    if (user.otp === otp && user.otpExpires > Date.now()) {
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.otp = undefined;
      user.otpExpires = undefined;

      await user.save();

      // Send Success Email
      const brandingColor = "#FC8019";
      const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FreshDrop</h1>
              </div>
              <div style="padding: 30px; background-color: #ffffff;">
                <p style="font-size: 16px; color: #333;">Hello <strong>${user.name}</strong>,</p>
                <p style="font-size: 16px; color: #555;">Your password has been successfully reset.</p>
                <p style="font-size: 14px; color: #777; margin-top: 20px;">If you did not make this change, please contact support immediately.</p>
                <p style="font-size: 14px; color: #777; margin-top: 30px;">Happy Ordering!<br>The FreshDrop Team</p>
              </div>
            </div>
          `;
      try {
        await sendEmail({
          email: user.email,
          subject: "Password Reset Successful",
          message: "Your password has been successfully reset.",
          html: htmlContent,
        });
      } catch (emailError) {
        console.error("Failed to send Password Reset email:", emailError);
      }

      res.json({
        message: "Password reset successful",
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: "Invalid or expired OTP" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request OTP for Profile Update (Email/Phone)
// @route   POST /api/auth/profile/otp/request
const requestProfileUpdateOtp = async (req, res) => {
  try {
    const { userId, field, value } = req.body; // field: 'email' or 'phone'

    if (!userId || !field || !value) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (field !== "email" && field !== "phone") {
      return res.status(400).json({ message: "Invalid field" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if taken
    const existing = await User.findOne({
      [field]: value,
      _id: { $ne: userId },
    });
    if (existing) {
      return res.status(400).json({
        message: `${field === "email" ? "Email" : "Phone"} is already taken`,
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    user.tempUpdate = {
      field,
      value,
      otp,
      otpExpires,
    };
    await user.save();

    // Send OTP
    let sentMethod = "";
    if (field === "email") {
      // Send Email
      const brandingColor = "#FC8019";
      const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: ${brandingColor}; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FreshDrop</h1>
              </div>
              <div style="padding: 30px; background-color: #ffffff;">
                <p style="font-size: 16px; color: #333;">Hello <strong>${user.name}</strong>,</p>
                <p style="font-size: 16px; color: #555;">You requested to update your <strong>Email</strong>.</p>
                <p style="font-size: 16px; color: #555;">Your Verification Code is:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: ${brandingColor};">${otp}</span>
                </div>
                <p style="font-size: 14px; color: #777;">If you did not request this, please ignore this email.</p>
              </div>
            </div>
          `;
      try {
        await sendEmail({
          email: value, // Send to NEW email
          subject: "Update Email Verification Code",
          message: `Your OTP is ${otp}`,
          html: htmlContent,
        });
        sentMethod = "Email";
      } catch (err) {
        console.error("Email send failed", err);
      }
    } else {
      // Send SMS
      try {
        await sendSms(value, otp); // Send to NEW phone
        sentMethod = "SMS";
      } catch (err) {
        console.error("SMS send failed", err);
      }
    }

    res.json({ message: `OTP sent to new ${field}`, devOtp: otp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP and Update Profile
// @route   POST /api/auth/profile/otp/verify
const verifyProfileUpdateOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.tempUpdate || !user.tempUpdate.otp) {
      return res.status(400).json({ message: "No pending update found" });
    }

    if (
      user.tempUpdate.otp === otp &&
      user.tempUpdate.otpExpires > Date.now()
    ) {
      // Success
      const { field, value } = user.tempUpdate;

      user[field] = value;
      user.tempUpdate = undefined; // Clear

      const updatedUser = await user.save();

      res.json({
        message: "Profile updated successfully",
        _id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone, // Return updated phone
        image: updatedUser.image,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(400).json({ message: "Invalid or Expired OTP" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  googleLogin,
  updateProfile,
  getProfile,
  resetPassword,
  requestProfileUpdateOtp,
  verifyProfileUpdateOtp,
  addToHistory,
};
