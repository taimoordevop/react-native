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
  Timestamp,
  arrayUnion,
  limit,
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
    buyerOrderId?: string | null;
    buyerPubgId?: string | null;
    buyerRatePer10k?: number | null;
    commissionPer10k?: number | null;
    isDirectRequest?: boolean;
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

  /** Creates a supplier request specifically linked to a buyer order with auto-calculated commission */
  async createSupplierRequest(data: {
    sellerId: string;
    sellerName: string;
    totalPopAmount: number;
    ratePer10k: number;
    notes: string | null;
    destinationPubgId: string | null;
    deliveryDeadline: string | null;
    buyerOrderId: string;
    buyerPubgId: string | null;
    buyerRatePer10k: number;
  }): Promise<string> {
    const commissionPer10k = Math.max(0, data.buyerRatePer10k - data.ratePer10k);
    return this.create({
      ...data,
      targetAudience: 'supplier',
      commissionPer10k,
    });
  },

  /** Update status of a request */
  async updateStatus(id: string, status: RequestStatus): Promise<void> {
    await updateDoc(doc(db, COLLECTION.REQUESTS, id), {
      status,
      updatedAt: serverTimestamp(),
      ...(status === 'completed' ? { completedAt: serverTimestamp() } : {}),
    });
  },

  /** Archive a request */
  async archive(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION.REQUESTS, id), {
      archived: true,
      updatedAt: serverTimestamp(),
    });
  },

  /** Get single request by ID */
  async getById(id: string): Promise<SellerRequest | null> {
    const snap = await getDoc(doc(db, COLLECTION.REQUESTS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as SellerRequest;
  },

  /** Get a request linked to a buyerOrderId */
  async getByBuyerOrderId(buyerOrderId: string): Promise<SellerRequest | null> {
    const q = query(
      collection(db, COLLECTION.REQUESTS),
      where('buyerOrderId', '==', buyerOrderId),
      where('targetAudience', '==', 'supplier'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as SellerRequest;
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
    const targetStatus = status === 'completed' ? 'verified' as BookingStatus : status;

    await updateDoc(doc(db, COLLECTION.BOOKINGS, id), {
      status: targetStatus,
      updatedAt: serverTimestamp(),
      ...(targetStatus === 'completed' ? { completedAt: serverTimestamp() } : {}),
      ...(extra ?? {}),
    });

    // Create Order if accepting a Direct Request booking
    if (targetStatus === 'accepted') {
      try {
        const bookingSnap = await getDoc(doc(db, COLLECTION.BOOKINGS, id));
        if (bookingSnap.exists()) {
          const booking = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
          const requestSnap = await getDoc(doc(db, COLLECTION.REQUESTS, booking.requestId));
          if (requestSnap.exists()) {
            const request = requestSnap.data();
            if (request.isDirectRequest) {
              const totalPKR = Math.round((booking.bookedAmount / 10000) * request.ratePer10k);
              
              const orderData = {
                listingId: null,
                supplierId: request.sellerId,
                supplierName: request.sellerName,
                buyerId: request.sellerId,
                buyerName: request.sellerName,
                popSupplierId: booking.supplierId,
                popSupplierName: booking.supplierName,
                targetPubgId: (extra?.buyerPubgId as string) || request.destinationPubgId || '',
                popAmount: booking.bookedAmount,
                agreedRatePer10k: request.ratePer10k,
                totalPKR,
                commission: 0,
                deliveryType: 'scheduled',
                deliveryNote: booking.deliveryTime,
                status: 'pending_payment',
                proofVideos: [],
                buyerPaymentProof: [],
                supplierPayoutProof: [],
                sellerPaymentProof: [],
                supplierPaymentConfirmed: false,
                isDirectRequest: true,
                notes: booking.proofNotes || 'Direct Supplier Request Order',
                completedAt: null,
                expiresAt: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };

              const orderRef = await addDoc(collection(db, COLLECTION.ORDERS), orderData);
              
              await updateDoc(doc(db, COLLECTION.BOOKINGS, id), {
                orderId: orderRef.id,
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to create Order for Direct Request:', err);
      }
    }

    // Auto-propagate verified proof videos to the linked Buyer Order when booking is verified!
    if (targetStatus === 'verified') {
      try {
        const bookingSnap = await getDoc(doc(db, COLLECTION.BOOKINGS, id));
        if (bookingSnap.exists()) {
          const booking = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
          const requestSnap = await getDoc(doc(db, COLLECTION.REQUESTS, booking.requestId));
          if (requestSnap.exists()) {
            const request = requestSnap.data();
            const buyerOrderId = request.buyerOrderId;
            if (buyerOrderId) {
              const proofUrl = booking.proofUrl || 'whatsapp';
              const urlsToPropagate = (booking.proofUrls && booking.proofUrls.length > 0)
                ? booking.proofUrls
                : [proofUrl];

              const videoEntries = urlsToPropagate.map((url) => ({
                url,
                diamondsSent: Math.round(booking.bookedAmount / urlsToPropagate.length),
                type: (url.includes('drive.google.com') || url === 'whatsapp') ? 'screenshot' as const : 'video' as const,
                uploadedAt: Timestamp.now(),
                notes: booking.proofNotes || `POP proof submitted by supplier ${booking.supplierName}`,
              }));

              await updateDoc(doc(db, COLLECTION.ORDERS, buyerOrderId), {
                status: 'verified',
                proofVideos: arrayUnion(...videoEntries),
                verifiedProofVideos: arrayUnion(...videoEntries),
                proofStatus: 'verified',
                proofMethod: proofUrl === 'whatsapp' ? 'whatsapp' : 'uploaded',
                popSupplierId: booking.supplierId,
                popSupplierName: booking.supplierName,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to propagate verified proof to buyer order:', err);
      }
    }
  },

  /** Supplier submits proof for a booking */
  async submitProof(
    id: string,
    proofUrl: string,
    proofNotes: string | null,
    proofUrls?: string[],
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION.BOOKINGS, id), {
      status: 'proof_submitted' as BookingStatus,
      proofUrl,
      proofUrls: proofUrls || [proofUrl],
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

  /** Real-time listener for a seller's bookings (where they are the poster of the request) */
  subscribeToSellerBookings(
    sellerId: string,
    callback: (bookings: Booking[]) => void,
  ) {
    const q = query(
      collection(db, COLLECTION.BOOKINGS),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
    });
  },
};
