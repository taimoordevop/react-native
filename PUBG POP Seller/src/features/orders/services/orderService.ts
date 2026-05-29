import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
  runTransaction,
  increment,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { COLLECTION, COMMISSION_PER_10K } from '@/constants';
import { uploadProofImage as cloudinaryUploadProofImage, uploadProofVideo as cloudinaryUploadProofVideo } from '@/lib/cloudinary';
import { db } from '@/lib/firebase';
import type { Order, OrderStatus, OrderProofVideo, Listing } from '@/shared/types';

// Lazy import to avoid circular deps — analytics imports nothing from orders
let _transactionService: typeof import('@/features/analytics/services/transactionService').transactionService | null = null;
async function getTransactionService() {
  if (!_transactionService) {
    const mod = await import('@/features/analytics/services/transactionService');
    _transactionService = mod.transactionService;
  }
  return _transactionService;
}

/** Valid status transitions — prevents illegal state changes */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'in_progress', 'cancelled'],
  paid:            ['in_progress', 'cancelled', 'disputed'],
  in_progress:     ['proof_submitted', 'disputed'],
  proof_submitted: ['verified', 'disputed'],
  verified:        ['completed'],
  completed:       [],
  disputed:        ['completed', 'cancelled'],
  cancelled:       [],
};

export function calcCommission(popAmount: number): number {
  return Math.round((popAmount / 10_000) * COMMISSION_PER_10K);
}

export function calcTotalPKR(popAmount: number, ratePer10k: number): number {
  return Math.round((popAmount / 10_000) * ratePer10k);
}

export type CreateOrderInput = {
  listing: Listing;
  buyerId: string;
  buyerName: string;
  targetPubgId: string;
  popAmount: number;
  notes?: string;
};

export type CreateDirectOrderInput = {
  listingId: string | null;
  supplierId: string;
  supplierName: string;
  buyerId: string;
  buyerName: string;
  targetPubgId: string;
  popAmount: number;
  agreedRatePer10k: number;
  deliveryType: 'instant' | 'scheduled';
  deliveryNote: string | null;
  notes?: string;
};

export const orderService = {
  /** Create an order directly (from a seller request, not a Listing object). */
  async createDirect(input: CreateDirectOrderInput): Promise<string> {
    const { listingId, supplierId, supplierName, buyerId, buyerName, targetPubgId, popAmount, agreedRatePer10k, deliveryType, deliveryNote, notes } = input;
    const totalPKR = calcTotalPKR(popAmount, agreedRatePer10k);
    const commission = calcCommission(popAmount);

    const data: Omit<Order, 'id'> & { deliveryType: string; deliveryNote: string | null } = {
      listingId,
      supplierId,
      buyerId,
      supplierName,
      buyerName,
      targetPubgId,
      popAmount,
      agreedRatePer10k,
      totalPKR,
      commission,
      deliveryType,
      deliveryNote: deliveryNote ?? null,
      status: 'pending_payment',
      proofVideos: [],
      buyerPaymentProof: [],
      supplierPayoutProof: [],
      notes: notes ?? null,
      completedAt: null,
      expiresAt: null,
      createdAt: serverTimestamp() as Order['createdAt'],
      updatedAt: serverTimestamp() as Order['updatedAt'],
    };

    const docRef = await addDoc(collection(db, COLLECTION.ORDERS), data);
    return docRef.id;
  },

  /** Create a new order from a listing. Status starts at pending_payment. */
  async createFromListing(input: CreateOrderInput): Promise<string> {
    const { listing, buyerId, buyerName, targetPubgId, popAmount, notes } = input;
    const totalPKR = calcTotalPKR(popAmount, listing.ratePer10k);
    const commission = calcCommission(popAmount);

    const data: Omit<Order, 'id'> = {
      listingId: listing.id,
      supplierId: listing.supplierId,
      buyerId,
      supplierName: listing.supplierName,
      buyerName,
      targetPubgId,
      popAmount,
      agreedRatePer10k: listing.ratePer10k,
      totalPKR,
      commission,
      status: 'pending_payment',
      proofVideos: [],
      buyerPaymentProof: [],
      supplierPayoutProof: [],
      notes: notes ?? null,
      completedAt: null,
      expiresAt: null,
      createdAt: serverTimestamp() as Order['createdAt'],
      updatedAt: serverTimestamp() as Order['updatedAt'],
    };

    const docRef = await addDoc(collection(db, COLLECTION.ORDERS), data);
    return docRef.id;
  },

  /** Transition order to a new status. Validates the transition is allowed. */
  async updateStatus(
    id: string,
    status: OrderStatus,
    extra?: Record<string, unknown>,
  ): Promise<void> {
    const order = await this.getById(id);
    if (!order) throw new Error('Order not found');

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(status)) {
      throw new Error(`Cannot transition from '${order.status}' to '${status}'`);
    }

    const update: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
      ...extra,
    };

    if (status === 'completed' || status === 'verified') {
      update.completedAt = serverTimestamp();
    }

    await updateDoc(doc(db, COLLECTION.ORDERS, id), update);
  },

  /** Upload a video/image file to Cloudinary, return the secure URL.
   *  onProgress is called with 0–100 during upload. */
  async uploadVideoProof(
    orderId: string,
    supplierId: string,
    localUri: string,
    ext: 'mp4' | 'jpg' = 'mp4',
    onProgress?: (pct: number) => void,
  ): Promise<string> {
    if (ext === 'jpg') {
      return cloudinaryUploadProofImage(orderId, supplierId, localUri, onProgress);
    }
    return cloudinaryUploadProofVideo(orderId, supplierId, localUri, onProgress);
  },

  /** Supplier appends a proof entry (video or screenshot) to the order
   *  and transitions status → proof_submitted */
  async submitProof(
    orderId: string,
    supplierId: string,
    proofVideo: Omit<OrderProofVideo, 'uploadedAt'>,
  ): Promise<void> {
    const order = await this.getById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.supplierId !== supplierId) throw new Error('Not your order');

    const videoEntry: OrderProofVideo = {
      ...proofVideo,
      uploadedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, COLLECTION.ORDERS, orderId), {
      proofVideos: arrayUnion(videoEntry),
      status: 'proof_submitted',
      updatedAt: serverTimestamp(),
    });
  },

  /** Seller accepts a buyer order: transitions to in_progress + decrements SellerRequest.remainingAmount */
  async acceptBuyerOrder(orderId: string, requestId: string | null, popAmount: number): Promise<void> {
    if (!requestId) {
      await this.updateStatus(orderId, 'in_progress');
      return;
    }
    await runTransaction(db, async (t) => {
      const requestRef = doc(db, COLLECTION.REQUESTS, requestId);
      const requestSnap = await t.get(requestRef);
      const currentRemaining = requestSnap.exists()
        ? ((requestSnap.data().remainingAmount as number) ?? 0)
        : 0;
      const newRemaining = Math.max(0, currentRemaining - popAmount);
      const newStatus = newRemaining === 0 ? 'fully_booked' : 'partially_booked';

      t.update(doc(db, COLLECTION.ORDERS, orderId), {
        status: 'in_progress',
        updatedAt: serverTimestamp(),
      });
      if (requestSnap.exists()) {
        t.update(requestRef, {
          remainingAmount: increment(-popAmount),
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
      }
    });
  },

  /** Upload a screenshot image to Cloudinary, return the secure URL */
  async uploadProofImage(orderId: string, userId: string, localUri: string, onProgress?: (pct: number) => void): Promise<string> {
    return cloudinaryUploadProofImage(orderId, userId, localUri, onProgress);
  },

  /** Buyer appends payment screenshot URLs — status stays pending_payment */
  async submitBuyerPaymentProof(orderId: string, imageUrls: string[]): Promise<void> {
    await updateDoc(doc(db, COLLECTION.ORDERS, orderId), {
      buyerPaymentProof: arrayUnion(...imageUrls),
      updatedAt: serverTimestamp(),
    });
  },

  /** Seller confirms payment was received — pending_payment → in_progress */
  async confirmPaymentReceived(orderId: string): Promise<void> {
    await this.updateStatus(orderId, 'in_progress');
  },

  /** Seller uploads payout proof to supplier + transitions verified → completed.
   *  Also auto-creates a profit transaction record for analytics. */
  async submitSellerPayoutProof(orderId: string, imageUrls: string[]): Promise<void> {
    await updateDoc(doc(db, COLLECTION.ORDERS, orderId), {
      supplierPayoutProof: arrayUnion(...imageUrls),
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Fire-and-forget: create profit transaction (non-blocking, won't fail the upload)
    try {
      const order = await this.getById(orderId);
      if (order) {
        const txSvc = await getTransactionService();
        await txSvc.createFromCompletedOrder({
          sellerId: order.supplierId,
          orderId: order.id,
          totalPKR: order.totalPKR,
          commission: order.commission,
          popAmount: order.popAmount,
          agreedRatePer10k: order.agreedRatePer10k,
          buyerName: order.buyerName,
        });
      }
    } catch {
      // Analytics failure must never block the user flow
    }
  },

  /** Verify proof and release escrow — marks order as verified → completed */
  async verifyAndComplete(orderId: string): Promise<void> {
    await this.updateStatus(orderId, 'verified');
  },

  async getById(id: string): Promise<Order | null> {
    const snap = await getDoc(doc(db, COLLECTION.ORDERS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Order;
  },

  async getByBuyer(buyerId: string): Promise<Order[]> {
    const q = query(
      collection(db, COLLECTION.ORDERS),
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  },

  async getBySupplier(supplierId: string): Promise<Order[]> {
    const q = query(
      collection(db, COLLECTION.ORDERS),
      where('supplierId', '==', supplierId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  },

  /** Real-time listener — fires callback on every change to the order */
  subscribeToOrder(
    id: string,
    callback: (order: Order | null) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(db, COLLECTION.ORDERS, id),
      (snap) => {
        if (!snap.exists()) { callback(null); return; }
        callback({ id: snap.id, ...snap.data() } as Order);
      },
      (err) => {
        console.error('[orderService] subscribeToOrder error:', err.message);
        onError?.(err);
      },
    );
  },

  /** Real-time listener for all orders belonging to a user (by role) */
  subscribeToMyOrders(
    userId: string,
    role: 'buyer' | 'supplier',
    callback: (orders: Order[]) => void,
    onError?: (err: Error) => void,
  ): Unsubscribe {
    const field = role === 'buyer' ? 'buyerId' : 'supplierId';
    const q = query(
      collection(db, COLLECTION.ORDERS),
      where(field, '==', userId),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
      },
      (err) => {
        console.error('[orderService] subscribeToMyOrders error:', err.message);
        onError?.(err);
      },
    );
  },
};
