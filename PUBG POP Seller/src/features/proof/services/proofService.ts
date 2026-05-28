import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { COLLECTION } from '@/constants';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { db } from '@/lib/firebase';
import type { Proof, ProofMedia } from '@/shared/types';

export const proofService = {
  async submit(data: Omit<Proof, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION.PROOFS), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateStatus(
    id: string,
    status: Proof['status'],
    rejectionReason?: string,
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION.PROOFS, id), {
      status,
      ...(rejectionReason ? { rejectionReason } : {}),
      updatedAt: serverTimestamp(),
    });
  },

  async getById(id: string): Promise<Proof | null> {
    const snap = await getDoc(doc(db, COLLECTION.PROOFS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Proof;
  },

  async getByOrder(orderId: string): Promise<Proof | null> {
    const q = query(collection(db, COLLECTION.PROOFS), where('orderId', '==', orderId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Proof;
  },

  async uploadMedia(
    sellerId: string,
    orderId: string,
    uri: string,
    _fileName: string,
    type: 'image' | 'video',
  ): Promise<ProofMedia> {
    const result = await uploadToCloudinary(
      uri,
      `proofs/${sellerId}/${orderId}`,
      type,
    );
    return {
      uri: result.secure_url,
      type,
      uploadedAt: serverTimestamp() as ProofMedia['uploadedAt'],
    };
  },
};
