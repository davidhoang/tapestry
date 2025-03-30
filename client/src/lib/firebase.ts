import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  }.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Function to sign in with Google
export const signInWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
};

// Function to handle redirect result
export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User is signed in
      // We can now get the Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      // The signed-in user info
      const user = result.user;
      
      // Now we need to authenticate with our backend
      if (user && user.email) {
        try {
          const response = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebaseUid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            }),
            credentials: 'include', // Important for session cookies
          });
          
          if (!response.ok) {
            console.error('Backend authentication failed:', await response.text());
            throw new Error('Failed to authenticate with server');
          }
          
          // Successfully authenticated with our backend
          return {
            success: true,
            user,
            token
          };
        } catch (backendError) {
          console.error('Backend auth error:', backendError);
          return {
            success: false,
            error: {
              message: 'Failed to authenticate with server',
              originalError: backendError
            }
          };
        }
      }
      
      return {
        success: true,
        user,
        token
      };
    }
    return { success: false };
  } catch (error: any) {
    // Handle Errors here
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used
    const email = error.customData?.email;
    // The AuthCredential type that was used
    const credential = GoogleAuthProvider.credentialFromError(error);
    
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        email,
        credential
      }
    };
  }
};

export { auth };