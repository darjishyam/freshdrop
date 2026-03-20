// Quick script to clear AsyncStorage and test fresh login
// Run this in browser console

(async () => {
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;

  
  await AsyncStorage.clear();
  
  
})();
