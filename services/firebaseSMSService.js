import { Platform } from "react-native";

// Conditionally import native firebase to avoid Web crashes
let nativeAuth = null;
if (Platform.OS !== "web") {
  try {
    const rnFirebase = require("@react-native-firebase/auth");
    nativeAuth = rnFirebase.default;
  } catch (e) {
    console.warn("Native Firebase Auth not available");
  }
}

/**
 * Firebase Phone Authentication Service
 * Handles OTP sending and verification with automatic SMS autofill on Android
 */
class FirebaseSMSService {
  constructor() {
    this.confirmation = null;
    this.isWeb = Platform.OS === "web";
  }

  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - Phone number with country code (e.g., "+919876543210")
   * @returns {Promise<object>} Confirmation object
   */
  async sendOTP(phoneNumber) {
    try {
      // Ensure phone number has country code
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber}`;

      console.log("📱 Sending OTP to:", formattedPhone);

      if (this.isWeb) {
        // Web support requires reCAPTCHA verifier implementation
        // For now, we return error instructing to use mobile or implement web specific flow
        throw new Error(
          "Web Firebase Auth requires Recaptcha. Please test on Android/iOS for autofill.",
        );
      }

      if (!nativeAuth) {
        throw new Error(
          "Native Firebase (Android/iOS) not configured or installed",
        );
      }

      // Send OTP via Firebase Native
      // This automatically triggers SMS Retriever API on Android
      this.confirmation =
        await nativeAuth().signInWithPhoneNumber(formattedPhone);

      console.log("✅ OTP sent successfully");

      return {
        success: true,
        confirmation: this.confirmation,
        message: "OTP sent successfully",
      };
    } catch (error) {
      console.error("❌ Firebase SMS Error:", error);

      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  /**
   * Verify OTP
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<object>} User credential
   */
  async verifyOTP(otp) {
    try {
      if (!this.confirmation) {
        throw new Error("No OTP request found. Please send OTP first.");
      }

      console.log("🔐 Verifying OTP...");

      // Verify OTP
      const userCredential = await this.confirmation.confirm(otp);

      console.log("✅ OTP verified successfully");

      return {
        success: true,
        user: userCredential.user,
        phoneNumber: userCredential.user.phoneNumber,
      };
    } catch (error) {
      console.error("❌ OTP Verification Error:", error);

      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  /**
   * Check if Firebase is available (Best on Android for SMS autofill)
   */
  isAvailable() {
    return Platform.OS === "android";
  }

  /**
   * Reset confirmation state
   */
  reset() {
    this.confirmation = null;
  }
}

// Export singleton instance
export default new FirebaseSMSService();
