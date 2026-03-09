import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Web Client ID from google-services.json
// This is required for the ID token to be generated correctly for the backend
const WEB_CLIENT_ID = '620352640426-g4tviqolht9lc0tkcebnf5t5kp2coffm.apps.googleusercontent.com';

export const configureGoogleSignIn = () => {
    if (Platform.OS === 'web') {
        GoogleSignin.configure({
            webClientId: WEB_CLIENT_ID,
        });
    } else {
        GoogleSignin.configure({
            webClientId: WEB_CLIENT_ID,
            offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
            forceCodeForRefreshToken: true, // [Android] related to offlineAccess
            profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
        });
    }
};

// Helper to ensure Google Script is loaded for Web
const ensureGoogleScriptLoaded = () => {
    return new Promise((resolve, reject) => {
        if (Platform.OS !== 'web') {
            resolve(true);
            return;
        }

        // Check if GIS is loaded
        if (window.google && window.google.accounts) {
            resolve(true);
            return;
        }

        // Check if script tag exists
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(true));
            existingScript.addEventListener('error', () => reject(new Error("Failed to load Google JS SDK")));
            return;
        }

        // Inject GIS script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log('✅ Google JS SDK loaded successfully');
            resolve(true);
        };
        script.onerror = (error) => {
            console.error('❌ Failed to load Google JS SDK from:', script.src);
            console.error('Error details:', error);
            console.error('Possible reasons: 1) Network/Firewall blocking Google, 2) Browser blocking third-party scripts, 3) CSP policy');
            reject(new Error("Failed to load Google JS SDK"));
        };
        document.head.appendChild(script);
    });
};

// Manual Web Sign-In using GIS (OAuth2)
const signInWithGoogleWeb = () => {
    return new Promise((resolve, reject) => {
        try {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: WEB_CLIENT_ID,
                scope: 'profile email openid',
                callback: (response) => {
                    if (response.access_token) {
                        // NOTE: This returns an access_token, not an id_token.
                        // The backend must be able to verify access_token or fetch user info using it.
                        resolve(response.access_token);
                    } else {
                        reject(new Error("No access token received"));
                    }
                },
                error_callback: (error) => {
                    reject(error);
                },
            });
            client.requestAccessToken();
        } catch (error) {
            reject(error);
        }
    });
};

export const signInWithGoogle = async () => {
    try {
        if (Platform.OS === 'android') {
            await GoogleSignin.hasPlayServices();
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // Ignore if already signed out
            }

            const userInfo = await GoogleSignin.signIn();
            const { idToken } = userInfo.data || {};
            return idToken;

        } else if (Platform.OS === 'web') {
            await ensureGoogleScriptLoaded();
            // Use manual implementation for Web
            return await signInWithGoogleWeb();
        }
    } catch (error) {
        if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
            console.error("Google Sign-In Error: PLAY_SERVICES_NOT_AVAILABLE. This usually means the Google Play Services APK is missing (Android) or the Google JS SDK is not loaded/configured (Web).");
        } else if (error.code) {
            console.error("Google Sign-In Error Code:", error.code);
        }
        throw error;
    }
};

export const signOutGoogle = async () => {
    try {
        await GoogleSignin.signOut();
    } catch (error) {
        console.error("Google Sign-Out Error:", error);
    }
}
