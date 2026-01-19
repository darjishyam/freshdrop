// Quick script to clear AsyncStorage and test fresh login
// Run this in browser console

(async () => {
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;

  console.log("🗑️ Clearing AsyncStorage...");
  await AsyncStorage.clear();
  console.log("✅ AsyncStorage cleared!");
  console.log("🔄 Please refresh the page and login again");
})();
