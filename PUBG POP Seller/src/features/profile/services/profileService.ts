import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { COLLECTION } from '@/constants';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { db } from '@/lib/firebase';
import type { UserProfile, UserRole } from '@/shared/types';

/** Remove any keys whose value is undefined (Firestore rejects undefined values) */
function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) =>
        v !== null && typeof v === 'object' && !Array.isArray(v)
          ? [k, stripUndefined(v as object)]
          : [k, v],
      ),
  ) as T;
}

export const profileService = {
  /** Fetch a user profile by UID. Returns null if document doesn't exist. */
  async getById(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, COLLECTION.USERS, uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as UserProfile;
  },

  /** Partial update — always stamps updatedAt. Strips undefined to avoid Firestore errors. */
  async update(uid: string, data: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, COLLECTION.USERS, uid), {
      ...stripUndefined(data as object),
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

  /** Upload a new avatar image to Cloudinary and update the user document. */
  async uploadAvatar(uid: string, uri: string): Promise<string> {
    const result = await uploadToCloudinary(uri, `profile-photos/${uid}`, 'image');
    const url = result.secure_url;
    await updateDoc(doc(db, COLLECTION.USERS, uid), {
      photoURL: url,
      updatedAt: serverTimestamp(),
    });
    return url;
  },
};
