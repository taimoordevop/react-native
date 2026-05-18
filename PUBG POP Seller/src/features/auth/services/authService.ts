import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

import { COLLECTION } from '@/constants';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/shared/types';

export const authService = {
  /** Register a new user. Creates a Firestore document with default values. */
  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });

    const userProfile: Omit<UserProfile, 'id'> = {
      uid: credential.user.uid,
      email,
      displayName,
      photoURL: null,
      phoneNumber: null,
      role: 'buyer', // default role — changed during onboarding
      pubgId: null,
      pubgNickname: null,
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
      onboardingCompleted: false, // triggers onboarding flow after auth
      fcmToken: null,
      createdAt: serverTimestamp() as UserProfile['createdAt'],
      updatedAt: serverTimestamp() as UserProfile['updatedAt'],
    };

    await setDoc(doc(db, COLLECTION.USERS, credential.user.uid), userProfile);
    return { ...userProfile, id: credential.user.uid };
  },

  /** Sign in with email and password. */
  async signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  },

  /** Sign out the current user. */
  async signOut() {
    return firebaseSignOut(auth);
  },

  /** Send a password reset email. */
  async resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  },

  /** Fetch the full user profile from Firestore. Returns null if not found. */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, COLLECTION.USERS, uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as UserProfile;
  },
};
