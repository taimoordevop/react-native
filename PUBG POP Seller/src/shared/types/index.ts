import type { Timestamp } from 'firebase/firestore';

export type FirestoreTimestamp = Timestamp;

/** Role of the user in the marketplace */
export type UserRole = 'buyer' | 'supplier' | 'admin';

export interface BaseDocument {
  id: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface UserProfile extends BaseDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phoneNumber: string | null;
  // Role determines what the user can do in the app
  role: UserRole;
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

export interface Order extends BaseDocument {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  buyerId: string;
  price: number;
  currency: string;
  status:
    | 'pending'
    | 'accepted'
    | 'in_progress'
    | 'proof_submitted'
    | 'completed'
    | 'cancelled'
    | 'disputed';
  proofId: string | null;
  notes: string | null;
  completedAt: FirestoreTimestamp | null;
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

export type Theme = 'light' | 'dark' | 'system';

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
