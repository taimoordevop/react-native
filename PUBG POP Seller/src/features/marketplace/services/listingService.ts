import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

import { COLLECTION } from '@/constants';
import { db } from '@/lib/firebase';
import type { Listing, ListingStatus } from '@/shared/types';

/** Fields required to create a new listing */
export type CreateListingInput = {
  supplierId: string;
  supplierName: string;
  supplierPubgNickname: string | null;
  popAmount: number;
  ratePer10k: number;
  minAmount: number;
  totalAvailable: number | null;
  expiresAt: Listing['expiresAt'];
};

export const listingService = {
  /** Create a new POP listing. Returns the Firestore doc ID. */
  async create(data: CreateListingInput): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION.LISTINGS), {
      ...data,
      status: 'active' satisfies ListingStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** Partial update — always stamps updatedAt. */
  async update(id: string, data: Partial<Omit<Listing, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, COLLECTION.LISTINGS, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /** Hard delete — only callable by owner or admin (enforced by Firestore rules). */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION.LISTINGS, id));
  },

  /** Fetch a single listing by ID. */
  async getById(id: string): Promise<Listing | null> {
    const snap = await getDoc(doc(db, COLLECTION.LISTINGS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Listing;
  },

  /** Fetch all listings for a specific supplier, newest first. */
  async getBySupplier(supplierId: string): Promise<Listing[]> {
    const q = query(
      collection(db, COLLECTION.LISTINGS),
      where('supplierId', '==', supplierId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Listing);
  },

  /** Fetch active listings for the marketplace feed, sorted by best rate. */
  async getActive(limitCount = 30): Promise<Listing[]> {
    const q = query(
      collection(db, COLLECTION.LISTINGS),
      where('status', '==', 'active'),
      orderBy('ratePer10k', 'asc'), // cheapest rate first = best deal for buyers
      limit(limitCount),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Listing);
  },

  /** Mark a listing as sold_out or expired. */
  async setStatus(id: string, status: ListingStatus): Promise<void> {
    await updateDoc(doc(db, COLLECTION.LISTINGS, id), {
      status,
      updatedAt: serverTimestamp(),
    });
  },
};
