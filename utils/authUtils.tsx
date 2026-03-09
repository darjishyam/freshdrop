/**
 * Authentication Utilities
 *
 * Helper functions for authentication-related operations
 */

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate OTP (6 digits)
 * @param {string} otp - OTP to validate
 * @returns {boolean} - Whether the OTP is valid
 */
export const validateOTP = (otp) => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

/**
 * Validate name (at least 2 characters)
 * @param {string} name - Name to validate
 * @returns {boolean} - Whether the name is valid
 */
export const validateName = (name) => {
  return name && name.trim().length >= 2;
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone || phone.length !== 10) return phone;
  return `${phone.slice(0, 5)} ${phone.slice(5)}`;
};

/**
 * Mask phone number for security
 * @param {string} phone - Phone number to mask
 * @returns {string} - Masked phone number
 */
export const maskPhoneNumber = (phone) => {
  if (!phone || phone.length !== 10) return phone;
  return `******${phone.slice(-4)}`;
};

/**
 * Generate error messages for validation
 */
export const getValidationError = (field, value) => {
  switch (field) {
    case "phone":
      if (!value) return "Phone number is required";
      if (!validatePhone(value))
        return "Please enter a valid 10-digit phone number";
      return null;
    case "email":
      if (!value) return "Email is required";
      if (!validateEmail(value)) return "Please enter a valid email address";
      return null;
    case "name":
      if (!value) return "Name is required";
      if (!validateName(value)) return "Name must be at least 2 characters";
      return null;
    case "otp":
      if (!value) return "OTP is required";
      if (!validateOTP(value)) return "Please enter a valid 6-digit OTP";
      return null;
    default:
      return null;
  }
};
