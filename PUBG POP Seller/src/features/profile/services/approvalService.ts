import {
  doc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { COLLECTION } from '@/constants';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { db } from '@/lib/firebase';
import type { SellerApprovalRequest, UserProfile } from '@/shared/types';

/** Helper to send Expo Push Notification */
async function sendPushNotification(expoPushToken: string | null | undefined, title: string, body: string) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    console.log('[PUSH] Invalid or missing Expo push token:', expoPushToken);
    return;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        title,
        body,
        sound: 'default',
        data: { screen: '/(seller)/dashboard' },
      }),
    });
    const data = await response.json();
    console.log('[PUSH] Expo notification sent successfully:', data);
  } catch (err) {
    console.error('[PUSH] Failed to send Expo push notification:', err);
  }
}

export const approvalService = {
  /**
   * Submit CNIC and Selfie for Seller Approval
   */
  async submitSellerApproval(
    userId: string,
    userName: string,
    userEmail: string,
    cnicNumber: string,
    localSelfieUri: string,
    onProgress?: (pct: number) => void
  ): Promise<void> {
    console.log('[APPROVAL] Starting submission for:', userId, 'CNIC:', cnicNumber);
    
    // 1. Upload selfie to Cloudinary
    onProgress?.(10);
    const result = await uploadToCloudinary(
      localSelfieUri,
      `seller-approvals/${userId}`,
      'image',
      (pct) => onProgress?.(10 + Math.floor(pct * 0.7)) // scaling up to 80% progress
    );
    const selfieUrl = result.secure_url;
    onProgress?.(85);

    // 2. Create approval request record in Firestore
    const requestRef = doc(db, COLLECTION.SELLER_APPROVALS, userId); // using userId as doc ID to ensure 1 pending request at a time
    const requestData: Omit<SellerApprovalRequest, 'id'> = {
      userId,
      userName,
      userEmail,
      cnicNumber,
      cnicSelfieUrl: selfieUrl,
      status: 'pending',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    await setDoc(requestRef, requestData);
    onProgress?.(95);

    // 3. Update User Profile status to 'pending'
    const userRef = doc(db, COLLECTION.USERS, userId);
    await updateDoc(userRef, {
      sellerApprovalStatus: 'pending',
      cnicNumber,
      cnicSelfieUrl: selfieUrl,
      updatedAt: serverTimestamp(),
    });
    onProgress?.(100);
    console.log('[APPROVAL] Submission completed successfully');
  },

  /**
   * Retrieve list of all pending approval requests (for Admin)
   */
  async getPendingApprovals(): Promise<SellerApprovalRequest[]> {
    const q = query(
      collection(db, COLLECTION.SELLER_APPROVALS),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    const list: SellerApprovalRequest[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as SellerApprovalRequest);
    });

    // Sort locally by createdAt desc to avoid composite index requirements
    list.sort((a, b) => {
      const aSec = a.createdAt?.seconds ?? 0;
      const bSec = b.createdAt?.seconds ?? 0;
      return bSec - aSec;
    });

    return list;
  },

  /**
   * Approve or Reject a Seller Request
   */
  async processApproval(
    userId: string,
    status: 'approved' | 'rejected',
    notes: string
  ): Promise<void> {
    console.log('[APPROVAL] Processing request for:', userId, 'Status:', status);
    
    const now = serverTimestamp();

    // 1. Update the request document
    const requestRef = doc(db, COLLECTION.SELLER_APPROVALS, userId);
    await updateDoc(requestRef, {
      status,
      notes,
      updatedAt: now,
    });

    // 2. Fetch target user's FCM token / push token from user profile
    const userRef = doc(db, COLLECTION.USERS, userId);
    const userSnap = await getDocs(query(collection(db, COLLECTION.USERS), where('uid', '==', userId)));
    let userProfile: UserProfile | null = null;
    userSnap.forEach((d) => {
      userProfile = { id: d.id, ...d.data() } as UserProfile;
    });

    // 3. Update target user profile
    await updateDoc(userRef, {
      sellerApprovalStatus: status,
      approvalNotes: notes || null,
      updatedAt: now,
    });

    // 4. Save notification log in Firestore
    const notificationRef = doc(collection(db, COLLECTION.NOTIFICATIONS));
    const title = status === 'approved' ? 'Seller Account Approved! ✅' : 'Seller Account Rejected ❌';
    const body = status === 'approved'
      ? 'Your Seller account has been approved! Please log out and log in again for full access.'
      : `Your Seller account verification failed. Reason: ${notes || 'Information provided did not meet requirements. Please re-submit.'}`;

    await setDoc(notificationRef, {
      userId,
      title,
      body,
      type: 'seller_approval',
      read: false,
      createdAt: now,
    });

    // 5. Send Expo Push Notification
    if (userProfile && (userProfile as UserProfile).fcmToken) {
      await sendPushNotification((userProfile as UserProfile).fcmToken, title, body);
    }
  },
};
