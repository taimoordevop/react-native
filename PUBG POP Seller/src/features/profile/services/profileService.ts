import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { COLLECTION } from '@/constants';
import { db, storage } from '@/lib/firebase';
import type { UserProfile, UserRole } from '@/shared/types';

export const profileService = {
  /** Fetch a user profile by UID. Returns null if document doesn't exist. */
  async getById(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, COLLECTION.USERS, uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as UserProfile;
  },

  /** Partial update — always stamps updatedAt. */
  async update(uid: string, data: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, COLLECTION.USERS, uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /** Set the user's role. Called during onboarding step 1. */
  async setRole(uid: string, role: UserRole): Promise<void> {
    await updateDoc(doc(db, COLLECTION.USERS, uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  },

  /** Save PUBG profile and mark onboarding as complete. Called during onboarding step 2. */
  async completePubgSetup(
    uid: string,
    pubgId: string,
    pubgNickname: string,
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION.USERS, uid), {
      pubgId,
      pubgNickname,
      onboardingCompleted: true,
      updatedAt: serverTimestamp(),
    });
  },

  /** Upload a new avatar image to Firebase Storage and update the user document. */
  async uploadAvatar(uid: string, uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `avatars/${uid}/profile.jpg`);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db, COLLECTION.USERS, uid), {
      photoURL: url,
      updatedAt: serverTimestamp(),
    });
    return url;
  },
};
