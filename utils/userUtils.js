// User validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export const validateOTP = (otp) => {
  return otp.length === 6 && /^[0-9]+$/.test(otp);
};

export const formatPhoneNumber = (phone) => {
  if (phone.length === 10) {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
};

export const isUserLoggedIn = (user) => {
  return user && user.phone && user.phone.length > 0;
};
