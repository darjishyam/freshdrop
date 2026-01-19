// Import the functions you need from the SDKs you need
import { getAnalytics, isSupported } from "firebase/analytics";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdS-c4g9utGzgxPy0KA4Q7xpcjES5n9tQ",
  authDomain: "freshdrop-d3c24.firebaseapp.com",
  projectId: "freshdrop-d3c24",
  storageBucket: "freshdrop-d3c24.firebasestorage.app",
  messagingSenderId: "380193662825",
  appId: "1:380193662825:web:2ffd25b499cdba01a73ff8",
  measurementId: "G-TCY3JB0RD0",
};

// Initialize Firebase
let app;
let analytics;
let auth;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Analytics only supported in browser environments
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });

  auth = getAuth(app);

  console.log("🔥 Firebase Web SDK Configured");
} catch (e) {
  console.error("Firebase Web Config Error:", e);
}

export { analytics, app, auth, firebaseConfig };
