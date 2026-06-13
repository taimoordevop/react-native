import type { Timestamp } from 'firebase/firestore';

export type FirestoreTimestamp = Timestamp;

/** Role of the user in the marketplace */
export type UserRole = 'buyer' | 'supplier' | 'seller' | 'admin';

export interface BaseDocument {
  id: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type PaymentMethodType = 'JazzCash' | 'EasyPaisa' | 'Bank Transfer' | 'SadaPay' | 'NayaPay';

export interface PaymentMethod {
  type: PaymentMethodType;
  accountNumber: string;
  accountTitle?: string;
}

/** Legacy flat shape — kept for backwards-compat reads from old documents */
export interface SellerPaymentDetails {
  jazzCash?: string;
  easyPaisa?: string;
  bankAccount?: string;
  bankName?: string;
  /** New format: list of payment methods */
  methods?: PaymentMethod[];
}

export interface UserProfile extends BaseDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phoneNumber: string | null;
  // Role determines what the user can do in the app
  role: UserRole;
  /** Payment details shown to buyers so they can send manual transfers */
  paymentDetails: SellerPaymentDetails | null;
  // PUBG identity
  pubgId: string | null;
  pubgNickname: string | null;
  pubgServer: string | null;
  bio: string | null;
  // Reputation is the trust score (0–100+)
  reputation: number;
  totalPopSent: number;
  totalPopReceived: number;
  // Legacy stats kept for backwards compatibility
  rating: number;
  totalReviews: number;
  totalSales: number;
  totalEarnings: number;
  isVerified: boolean;
  isBanned: boolean;
  // True once user has completed role + PUBG onboarding
  onboardingCompleted: boolean;
  fcmToken: string | null;
  whatsappNumber?: string | null;
  googleDriveFolder?: string | null;
  defaultCommissionPer10k?: number;
  sellerApprovalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  cnicNumber?: string;
  cnicSelfieUrl?: string;
  approvalNotes?: string;
}

export interface SellerApprovalRequest extends BaseDocument {
  userId: string;
  userName: string;
  userEmail: string;
  cnicNumber: string;
  cnicSelfieUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type ListingStatus = 'active' | 'expired' | 'sold_out';

export interface Listing extends BaseDocument {
  supplierId: string;
  supplierName: string;       // denormalized from UserProfile.displayName
  supplierPubgNickname: string | null; // denormalized for quick display
  /** Amount of POP (e.g. 50000) being offered */
  popAmount: number;
  /** Price in PKR per 10,000 POP (e.g. 260 means 10k POP = 260 PKR) */
  ratePer10k: number;
  /** Minimum order amount in POP */
  minAmount: number;
  /** Maximum/total available POP in this listing */
  totalAvailable: number | null;
  status: ListingStatus;
  /** Optional expiry timestamp — listing auto-expires after this */
  expiresAt: FirestoreTimestamp | null;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'in_progress'
  | 'proof_submitted'
  | 'verified'
  | 'payout_submitted'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export interface OrderProofVideo {
  url: string;
  uploadedAt: FirestoreTimestamp;
  /** Number of diamonds/POP units sent in this proof segment */
  diamondsSent: number;
  /** 'video' = screen recording, 'screenshot' = image */
  type: 'video' | 'screenshot';
  /** Optional low-res thumbnail URL (for video entries) */
  thumbnailUrl?: string;
  notes?: string;
}

export interface Order extends BaseDocument {
  listingId: string | null;
  supplierId: string;
  buyerId: string;
  /** Denormalized for display */
  supplierName: string;
  buyerName: string;
  /** Buyer's PUBG ID where POP will be sent */
  targetPubgId: string;
  popAmount: number;
  agreedRatePer10k: number;
  /** Total PKR = popAmount / 10000 * agreedRatePer10k */
  totalPKR: number;
  /** Platform commission in PKR (e.g. 40 PKR per 10k) */
  commission: number;
  status: OrderStatus;
  proofVideos: OrderProofVideo[];
  verifiedProofVideos?: OrderProofVideo[];
  proofStatus?: 'pending' | 'submitted' | 'verified';
  notes: string | null;
  /** Screenshot URLs uploaded by buyer as payment proof */
  buyerPaymentProof: string[];
  /** Screenshot URLs uploaded by seller as payout proof to supplier */
  supplierPayoutProof: string[];
  completedAt: FirestoreTimestamp | null;
  expiresAt: FirestoreTimestamp | null;
  proofMethod?: 'uploaded' | 'whatsapp';
  popSupplierId?: string | null;
  popSupplierName?: string | null;
  isDirectRequest?: boolean;
  sellerPaymentProof?: string[];
  supplierPaymentConfirmed?: boolean;
}

export interface Proof extends BaseDocument {
  orderId: string;
  sellerId: string;
  buyerId: string;
  mediaFiles: ProofMedia[];
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
}

export interface ProofMedia {
  uri: string;
  type: 'image' | 'video';
  thumbnailUri?: string;
  uploadedAt: FirestoreTimestamp;
}

export interface Review extends BaseDocument {
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  isFromBuyer: boolean;
}

// ── Seller Request / Booking flow ─────────────────────────────────────────────

/** Status of a seller's POP request (visible to buyers and suppliers) */
export type RequestStatus =
  | 'open'            // accepting supplier bookings + buyer orders
  | 'partially_booked'
  | 'fully_booked'
  | 'in_progress'     // at least one booking is being fulfilled
  | 'completed'
  | 'cancelled';

/** A POP request posted by a Seller.
 *  - 'buyer' audience: buyers see it as "POP available to purchase"
 *  - 'supplier' audience: suppliers see it as "POP needed — book how much you can send" */
export interface SellerRequest extends BaseDocument {
  sellerId: string;
  sellerName: string;
  /** Who this post is visible to: buyers OR suppliers (never both) */
  targetAudience: 'buyer' | 'supplier';
  /** Total POP the seller is dealing */
  totalPopAmount: number;
  /** PKR per 10,000 POP */
  ratePer10k: number;
  /** Remaining POP still available */
  remainingAmount: number;
  status: RequestStatus;
  /** Optional notes */
  notes: string | null;
  /** PUBG ID where supplier should send the POP (for supplier-audience posts) */
  destinationPubgId: string | null;
  /** Deadline by which supplier should send POP, e.g. 'within 2 hours' */
  deliveryDeadline: string | null;
  completedAt: FirestoreTimestamp | null;
  buyerOrderId?: string | null;
  buyerPubgId?: string | null;
  buyerRatePer10k?: number | null;
  commissionPer10k?: number | null;
  isDirectRequest?: boolean;
  archived?: boolean;
}

/** Status of a supplier's booking against a SellerRequest */
export type BookingStatus =
  | 'pending'       // awaiting seller acceptance
  | 'accepted'      // seller accepted, supplier should send POP
  | 'rejected'      // seller rejected
  | 'in_progress'   // supplier is sending POP
  | 'proof_submitted'
  | 'verified'      // seller verified proof videos, payout pending
  | 'payout_submitted' // seller uploaded payout screenshot, awaiting supplier confirmation
  | 'completed';

/** A supplier's booking for a portion of a SellerRequest */
export interface Booking extends BaseDocument {
  requestId: string;
  sellerId: string;
  supplierId: string;
  supplierName: string;
  supplierPubgId: string | null;
  /** Amount of POP this supplier has committed to supply */
  bookedAmount: number;
  /** When the supplier will send POP: 'instant' or a custom time string */
  deliveryTime: string;
  /** Buyer PUBG ID attached by seller when accepting — supplier uses this to send POP */
  buyerPubgId: string | null;
  status: BookingStatus;
  /** Proof URL submitted by supplier after sending POP */
  proofUrl: string | null;
  proofUrls?: string[];
  proofNotes: string | null;
  proofSubmittedAt: FirestoreTimestamp | null;
  supplierPayoutProof?: string[];
  completedAt: FirestoreTimestamp | null;
  orderId?: string;
}

export type TransactionType =
  | 'buyer_payment'
  | 'supplier_payout'
  | 'seller_profit'
  | 'manual'
  | 'manual_profit'
  | 'commission';

export interface Transaction {
  id: string;
  sellerId: string;
  /** Linked in-app order ID — null for manual/WhatsApp deals */
  orderId: string | null;
  buyerOrderId?: string;
  supplierRequestId?: string;
  type: TransactionType;
  amountPKR: number;
  /** Rate seller charged buyer per 10k POP */
  buyerRate?: number;
  buyerRatePer10k?: number;
  /** Rate seller paid supplier per 10k POP */
  supplierRate?: number;
  supplierRatePer10k?: number;
  /** Net profit = buyerRate - supplierRate, or manual entry */
  profitPKR: number;
  description: string;
  paymentMethod: string;
  proofUrl?: string;
  /** POP amount involved (for rate-based deals) */
  popAmount?: number;
  date: FirestoreTimestamp;
  isManual: boolean;
}

export type Theme = 'light' | 'dark' | 'system';

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
