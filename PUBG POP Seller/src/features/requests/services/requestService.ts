import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

import { COLLECTION } from '@/constants';
import { db } from '@/lib/firebase';
import type { SellerRequest, Booking, RequestStatus, BookingStatus } from '@/shared/types';

// ── SellerRequest CRUD ─────────────────────────────────────────────────────────

export const requestService = {
  /** Seller posts a new POP request */
  async create(data: {
    sellerId: string;
    sellerName: string;
    targetAudience: 'buyer' | 'supplier';
    totalPopAmount: number;
    ratePer10k: number;
    notes: string | null;
    destinationPubgId: string | null;
    deliveryDeadline: string | null;
  }): Promise<string> {
    const ref = await addDoc(collection(db, COLLECTION.REQUESTS), {
      ...data,
      remainingAmount: data.totalPopAmount,
      status: 'open' as RequestStatus,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Update status of a request */
  async updateStatus(id: string, status: RequestStatus): Promise<void> {
    await updateDoc(doc(db, COLLECTION.REQUESTS, id), {
      status,
      updatedAt: serverTimestamp(),
      ...(status === 'completed' ? { completedAt: serverTimestamp() } : {}),
    });
  },

  /** Get single request by ID */
  async getById(id: string): Promise<SellerRequest | null> {
    const snap = await getDoc(doc(db, COLLECTION.REQUESTS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as SellerRequest;
  },

  /** All open requests for buyers */
  async getOpenForBuyers(): Promise<SellerRequest[]> {
    const q = query(
      collection(db, COLLECTION.REQUESTS),
      where('targetAudience', '==', 'buyer'),
      where('status', 'in', ['open', 'partially_booked']),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerRequest);
  },

  /** All open requests for suppliers */
  async getOpenForSuppliers(): Promise<SellerRequest[]> {
    const q = query(
      collection(db, COLLECTION.REQUESTS),
      where('targetAudience', '==', 'supplier'),
      where('status', 'in', ['open', 'partially_booked']),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerRequest);
  },

  /** All requests posted by a specific seller */
  async getBySeller(sellerId: string): Promise<SellerRequest[]> {
    const q = query(
      collection(db, COLLECTION.REQUESTS),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerRequest);
  },

  /** Real-time listener for a seller's requests */
  subscribeToSellerRequests(
    sellerId: string,
    callback: (requests: SellerRequest[]) => void,
  ) {
    const q = query(
      collection(db, COLLECTION.REQUESTS),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerRequest));
    });
  },

  /** Real-time listener for open buyer requests */
  subscribeToOpenBuyerRequests(callback: (requests: SellerRequest[]) => void) {
    const q = query(
      collection(db, COLLECTION.REQUESTS),
      where('targetAudience', '==', 'buyer'),
      where('status', 'in', ['open', 'partially_booked']),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerRequest));
    });
  },

  /** Real-time listener for open supplier requests */
  subscribeToOpenSupplierRequests(callback: (requests: SellerRequest[]) => void) {
    const q = query(
      collection(db, COLLECTION.REQUESTS),
      where('targetAudience', '==', 'supplier'),
      where('status', 'in', ['open', 'partially_booked']),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerRequest));
    });
  },
};

// ── Booking CRUD ───────────────────────────────────────────────────────────────

export const bookingService = {
  /** Supplier books a portion of a request */
  async create(data: {
    requestId: string;
    sellerId: string;
    supplierId: string;
    supplierName: string;
    supplierPubgId: string | null;
    bookedAmount: number;
    deliveryTime: string;
  }): Promise<string> {
    const ref = await addDoc(collection(db, COLLECTION.BOOKINGS), {
      ...data,
      status: 'pending' as BookingStatus,
      buyerPubgId: null,
      proofUrl: null,
      proofNotes: null,
      proofSubmittedAt: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Decrement remaining amount on the request
    await updateDoc(doc(db, COLLECTION.REQUESTS, data.requestId), {
      remainingAmount: increment(-data.bookedAmount),
      status: 'partially_booked' as RequestStatus,
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Seller accepts or rejects a booking (extra can carry buyerPubgId etc.) */
  async updateStatus(id: string, status: BookingStatus, extra?: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, COLLECTION.BOOKINGS, id), {
      status,
      updatedAt: serverTimestamp(),
      ...(status === 'completed' ? { completedAt: serverTimestamp() } : {}),
      ...(extra ?? {}),
    });
  },

  /** Supplier submits proof for a booking */
  async submitProof(
    id: string,
    proofUrl: string,
    proofNotes: string | null,
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION.BOOKINGS, id), {
      status: 'proof_submitted' as BookingStatus,
      proofUrl,
      proofNotes,
      proofSubmittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  /** All bookings for a specific request (used by seller) */
  async getByRequest(requestId: string): Promise<Booking[]> {
    const q = query(
      collection(db, COLLECTION.BOOKINGS),
      where('requestId', '==', requestId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
  },

  /** All bookings by a specific supplier */
  async getBySupplier(supplierId: string): Promise<Booking[]> {
    const q = query(
      collection(db, COLLECTION.BOOKINGS),
      where('supplierId', '==', supplierId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
  },

  /** Real-time listener for bookings on a request */
  subscribeToRequestBookings(
    requestId: string,
    callback: (bookings: Booking[]) => void,
  ) {
    const q = query(
      collection(db, COLLECTION.BOOKINGS),
      where('requestId', '==', requestId),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
    });
  },

  /** Real-time listener for supplier's own bookings */
  subscribeToSupplierBookings(
    supplierId: string,
    callback: (bookings: Booking[]) => void,
  ) {
    const q = query(
      collection(db, COLLECTION.BOOKINGS),
      where('supplierId', '==', supplierId),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
    });
  },
};
