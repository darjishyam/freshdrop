import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Web Client ID from google-services.json
// This is required for the ID token to be generated correctly for the backend
const WEB_CLIENT_ID = '620352640426-g4tviqolht9lc0tkcebnf5t5kp2coffm.apps.googleusercontent.com';

export const configureGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
        forceCodeForRefreshToken: true, // [Android] related to offlineAccess
        profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
    });
};

export const signInWithGoogle = async () => {
    try {
        await GoogleSignin.hasPlayServices();

        try {
            await GoogleSignin.signOut();
        } catch (e) {
            // Ignore if already signed out
        }

        const userInfo = await GoogleSignin.signIn();
        // v10+ (and v16) returns data inside 'data' property
        const { idToken } = userInfo.data || {};
        return idToken;
    } catch (error) {
        if (error.code) {
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
