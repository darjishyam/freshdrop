import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useUser } from "./UserContext";
import { useToast } from "./ToastContext";

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [pendingItems, setPendingItems] = useState([]); // Items added before login
  const { user } = useUser();
  const { showToast } = useToast();
  const router = useRouter();

  // Sync pending items after login
  useEffect(() => {
    if (user.phone && pendingItems.length > 0) {
      console.log("Syncing pending items to cart...");
      setCartItems((prev) => {
        // Merge pending items
        const newCart = [...prev];
        pendingItems.forEach((pItem) => {
          const existing = newCart.find((i) => i.id === pItem.id);
          if (existing) {
            existing.quantity += pItem.quantity;
          } else {
            newCart.push(pItem);
          }
        });
        return newCart;
      });
      setPendingItems([]); // Clear pending
    }
  }, [user.phone]); // Run when user logs in

  const addToCart = (item) => {
    // If not logged in, add to pending and redirect
    if (!user.phone) {
      console.log("User not logged in. Adding to pending and redirecting...");
      setPendingItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.id === item.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        }
        return [...prev, item];
      });
      router.push("/auth/login");
      return;
    }

    // Normal logic
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
    showToast("Item added to cart");
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCartItems((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            return { ...i, quantity: Math.max(0, i.quantity + delta) };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const checkout = (cardNumber) => {
    if (cardNumber === "1234567890") {
      clearCart();
      return true;
    }
    return false;
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        checkout,
        pendingItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
