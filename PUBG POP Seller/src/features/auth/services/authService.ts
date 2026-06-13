import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, where, limit } from 'firebase/firestore';

import { COLLECTION } from '@/constants';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/shared/types';

export const authService = {
  /** Register a new user. Creates a Firestore document with default values. */
  async signUp(email: string, password: string, displayName: string, pubgNickname?: string): Promise<UserProfile> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });

    const userProfile: Omit<UserProfile, 'id'> = {
      uid: credential.user.uid,
      email,
      displayName,
      photoURL: null,
      phoneNumber: null,
      role: 'buyer', // default role — changed during onboarding
      paymentDetails: null,
      pubgId: null,
      pubgNickname: pubgNickname || null,
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
      defaultCommissionPer10k: 40,
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
  /** Returns true if no other user already uses this displayName. */
  async isDisplayNameAvailable(displayName: string): Promise<boolean> {
    const name = displayName.trim();
    if (!name) return false;
    const q = query(
      collection(db, COLLECTION.USERS),
      where('displayName', '==', name),
      limit(1),
    );
    const snap = await getDocs(q);
    return snap.empty;
  },

  /** Returns true if no user already uses this email. */
  async isEmailAvailable(email: string): Promise<boolean> {
    const value = email.trim().toLowerCase();
    if (!value) return false;
    const q = query(
      collection(db, COLLECTION.USERS),
      where('email', '==', value),
      limit(1),
    );
    const snap = await getDocs(q);
    return snap.empty;
  },
};
