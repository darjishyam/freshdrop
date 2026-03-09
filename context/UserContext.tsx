import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({ name: "", email: "", phone: "" });

  const [location, setLocation] = useState(
    "123, React Native Street, Expo City"
  );
  const [locationType, setLocationType] = useState("Home");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedLoc = await AsyncStorage.getItem("user_location");
        const savedType = await AsyncStorage.getItem("user_location_type");
        const savedUser = await AsyncStorage.getItem("user_data");

        if (savedLoc) setLocation(savedLoc);
        if (savedType) setLocationType(savedType);
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to load user data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const updateUser = async (data) => {
    setUser((prev) => {
      const newUser = { ...prev, ...data };
      AsyncStorage.setItem("user_data", JSON.stringify(newUser)).catch((e) =>
        console.error(e)
      );
      return newUser;
    });
  };

  const logout = async () => {
    await AsyncStorage.removeItem("user_data");
    setUser({ name: "", email: "", phone: "" });
  };

  const updateLocation = async (address) => {
    setLocation(address);
    await AsyncStorage.setItem("user_location", address);
  };

  const updateLocationType = async (type) => {
    setLocationType(type);
    await AsyncStorage.setItem("user_location_type", type);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        location,
        locationType,
        updateUser,
        updateLocation,
        updateLocationType,
        logout,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
