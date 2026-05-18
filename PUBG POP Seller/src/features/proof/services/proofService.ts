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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { COLLECTION } from '@/constants';
import { db, storage } from '@/lib/firebase';
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
    fileName: string,
    type: 'image' | 'video',
  ): Promise<ProofMedia> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `proofs/${sellerId}/${orderId}/${fileName}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return {
      uri: downloadURL,
      type,
      uploadedAt: serverTimestamp() as ProofMedia['uploadedAt'],
    };
  },
};
