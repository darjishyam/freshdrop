// Cart helper functions
export const calculateCartTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const calculateCartCount = (items) => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const findCartItem = (items, itemId) => {
  return items.find((item) => item.id === itemId);
};

export const formatPrice = (price) => {
  return `₹${price.toFixed(2)}`;
};

export const validateCheckout = (cartItems, user) => {
  if (cartItems.length === 0) {
    return { valid: false, message: "Cart is empty" };
  }

  if (!user.phone) {
    return { valid: false, message: "Please login to continue" };
  }

  return { valid: true };
};
