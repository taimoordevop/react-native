export const APP_NAME = 'PUBG MART';
export const APP_VERSION = '1.0.0';

export const COLLECTION = {
  USERS: 'users',
  LISTINGS: 'listings',
  ORDERS: 'orders',
  PROOFS: 'proofs',
  REVIEWS: 'reviews',
  REQUESTS: 'requests',
  BOOKINGS: 'bookings',
  NOTIFICATIONS: 'notifications',
  CHATS: 'chats',
  MESSAGES: 'messages',
  TRANSACTIONS: 'transactions',
  SELLER_APPROVALS: 'sellerApprovals',
} as const;

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  IN_PROGRESS: 'in_progress',
  PROOF_SUBMITTED: 'proof_submitted',
  VERIFIED: 'verified',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
} as const;

/** Platform commission in PKR per 10,000 POP */
export const COMMISSION_PER_10K = 40;

export const LISTING_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  SOLD_OUT: 'sold_out',
} as const;

export const PUBG_SERVERS = [
  'Asia',
  'North America',
  'Europe',
  'South America',
  'Middle East',
  'Oceania',
] as const;

/** Default POP amount presets shown in the Create Listing form */
export const POP_PRESETS = [10000, 25000, 50000, 100000, 250000] as const;

/** Typical PKR rate range per 10k POP for display hints */
export const RATE_HINT = { min: 240, max: 280 } as const;

/** Minimum POP per order */
export const MIN_ORDER_POP = 5000;

export const MAX_PROOF_FILES = 10;
export const MAX_FILE_SIZE_MB = 50;

export const QUERY_KEYS = {
  USER: 'user',
  LISTINGS: 'listings',
  LISTING: 'listing',
  ORDERS: 'orders',
  ORDER: 'order',
  PROOFS: 'proofs',
  REVIEWS: 'reviews',
  REQUESTS: 'requests',
  REQUEST: 'request',
  BOOKINGS: 'bookings',
  NOTIFICATIONS: 'notifications',
  TRANSACTIONS: 'transactions',
} as const;
