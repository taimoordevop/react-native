import Constants from 'expo-constants';
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { COLLECTION } from '@/constants';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/shared/types';

// Safe dynamic requires to prevent crashes in Expo Go
let GoogleSignin: any = null;
let LoginManager: any = null;
let AccessToken: any = null;

try {
  const googleModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleModule.GoogleSignin;
} catch (error) {
  console.warn('[SOCIAL AUTH] Google Sign-in native module is not available (e.g. running in Expo Go).');
}

try {
  const fbModule = require('react-native-fbsdk-next');
  LoginManager = fbModule.LoginManager;
  AccessToken = fbModule.AccessToken;
} catch (error) {
  console.warn('[SOCIAL AUTH] Facebook SDK native module is not available (e.g. running in Expo Go).');
}

// Retrieve credentials from Expo Config Extra
const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId || '';

// Configure Google Sign-In with Web Client ID if module is loaded
if (GoogleSignin && googleWebClientId) {
  try {
    GoogleSignin.configure({
      webClientId: googleWebClientId,
    });
    console.log('[SOCIAL AUTH] Google Sign-In configured successfully.');
  } catch (error) {
    console.error('[SOCIAL AUTH] Failed to configure Google Sign-In:', error);
  }
} else if (!GoogleSignin) {
  console.log('[SOCIAL AUTH] Google Sign-In setup skipped (module not loaded).');
} else {
  console.warn('[SOCIAL AUTH] GOOGLE_WEB_CLIENT_ID is missing from environment/config.');
}

/**
 * Checks if the user profile already exists in Firestore.
 * If not, creates a basic profile document with default fields.
 */
async function ensureUserProfileExists(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, COLLECTION.USERS, user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as UserProfile;
  }

  // Create new profile base
  const displayName = user.displayName || 'Soldier Recruit';
  const userProfile: Omit<UserProfile, 'id'> = {
    uid: user.uid,
    email: user.email || '',
    displayName: displayName,
    photoURL: user.photoURL || null,
    phoneNumber: user.phoneNumber || null,
    role: 'buyer', // Default role, chosen during onboarding
    paymentDetails: null,
    pubgId: null,
    pubgNickname: displayName, // Pre-fill PUBG nickname with social name
    pubgServer: null,
    bio: null,
    reputation: 0,
    totalPopSent: 0,
    totalPopReceived: 0,
    rating: 0,
    totalReviews: 0,
    totalSales: 0,
    totalEarnings: 0,
    isVerified: false,
    isBanned: false,
    onboardingCompleted: false, // Forces onboarding flow
    fcmToken: null,
    defaultCommissionPer10k: 40,
    sellerApprovalStatus: 'none',
    createdAt: serverTimestamp() as UserProfile['createdAt'],
    updatedAt: serverTimestamp() as UserProfile['updatedAt'],
  };

  await setDoc(userRef, userProfile);
  console.log(`[SOCIAL AUTH] Created new Firestore profile for social user: ${user.uid}`);
  return { ...userProfile, id: user.uid };
}

export const socialAuthService = {
  /**
   * Log in using real native Google Authentication.
   */
  async signInWithGoogle(): Promise<UserProfile> {
    if (!GoogleSignin) {
      throw new Error('Google Sign-In is not supported in Expo Go. To test Google Sign-In, please build a Development Client or run the compiled APK.');
    }

    console.log('[SOCIAL AUTH] Initiating native Google sign-in...');
    
    try {
      // Check if the device has Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Perform sign in
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: ID Token was not returned.');
      }

      // Authenticate with Firebase
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      return await ensureUserProfileExists(userCredential.user);
    } catch (error: any) {
      console.error('[SOCIAL AUTH] Google auth failed:', error);
      throw error;
    }
  },

  /**
   * Log in using real native Facebook Authentication.
   */
  async signInWithFacebook(): Promise<UserProfile> {
    if (!LoginManager || !AccessToken) {
      throw new Error('Facebook Login is not supported in Expo Go. To test Facebook Login, please build a Development Client or run the compiled APK.');
    }

    console.log('[SOCIAL AUTH] Initiating native Facebook Login...');

    try {
      // Clear previous login session if any
      LoginManager.logOut();

      // Attempt login with public profile and email permissions
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('Facebook authentication cancelled by user.');
      }

      // Retrieve access token
      const tokenData = await AccessToken.getCurrentAccessToken();
      
      if (!tokenData) {
        throw new Error('Facebook Login failed: Access Token was not returned.');
      }

      // Authenticate with Firebase
      const credential = FacebookAuthProvider.credential(tokenData.accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      return await ensureUserProfileExists(userCredential.user);
    } catch (error: any) {
      console.error('[SOCIAL AUTH] Facebook auth failed:', error);
      throw error;
    }
  },
};
