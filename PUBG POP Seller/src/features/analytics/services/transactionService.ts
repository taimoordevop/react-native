import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { COLLECTION } from '@/constants';
import { db } from '@/lib/firebase';
import type { Transaction, TransactionType } from '@/shared/types';

export interface CreateTransactionInput {
  sellerId: string;
  orderId: string | null;
  type: TransactionType;
  amountPKR: number;
  profitPKR: number;
  description: string;
  paymentMethod: string;
  buyerRate?: number;
  supplierRate?: number;
  popAmount?: number;
  proofUrl?: string;
  isManual: boolean;
}

/** Summary totals for a given period */
export interface ProfitSummary {
  totalProfit: number;
  totalRevenue: number;
  transactionCount: number;
}

function toTransaction(id: string, data: Record<string, unknown>): Transaction {
  return { id, ...data } as Transaction;
}

export const transactionService = {
  /** Create a new transaction record */
  async create(input: CreateTransactionInput): Promise<string> {
    const doc: Omit<Transaction, 'id'> = {
      sellerId: input.sellerId,
      orderId: input.orderId,
      type: input.type,
      amountPKR: input.amountPKR,
      profitPKR: input.profitPKR,
      description: input.description,
      paymentMethod: input.paymentMethod,
      isManual: input.isManual,
      date: serverTimestamp() as Transaction['date'],
      ...(input.buyerRate !== undefined ? { buyerRate: input.buyerRate } : {}),
      ...(input.supplierRate !== undefined ? { supplierRate: input.supplierRate } : {}),
      ...(input.popAmount !== undefined ? { popAmount: input.popAmount } : {}),
      ...(input.proofUrl ? { proofUrl: input.proofUrl } : {}),
    };
    const ref = await addDoc(collection(db, COLLECTION.TRANSACTIONS), doc);
    return ref.id;
  },

  /** Fetch all transactions for a seller, newest first, optionally limited */
  async getBySeller(sellerId: string, limitCount = 50): Promise<Transaction[]> {
    const q = query(
      collection(db, COLLECTION.TRANSACTIONS),
      where('sellerId', '==', sellerId),
      orderBy('date', 'desc'),
      limit(limitCount),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => toTransaction(d.id, d.data() as Record<string, unknown>));
  },

  /** Fetch transactions since a given JS timestamp (ms) */
  async getSince(sellerId: string, sinceMs: number): Promise<Transaction[]> {
    const since = Timestamp.fromMillis(sinceMs);
    const q = query(
      collection(db, COLLECTION.TRANSACTIONS),
      where('sellerId', '==', sellerId),
      where('date', '>=', since),
      orderBy('date', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => toTransaction(d.id, d.data() as Record<string, unknown>));
  },

  /** Compute profit summary from a list of transactions */
  summarise(txns: Transaction[]): ProfitSummary {
    return txns.reduce(
      (acc, t) => ({
        totalProfit: acc.totalProfit + t.profitPKR,
        totalRevenue: acc.totalRevenue + t.amountPKR,
        transactionCount: acc.transactionCount + 1,
      }),
      { totalProfit: 0, totalRevenue: 0, transactionCount: 0 },
    );
  },

  /** Auto-create profit transactions when an in-app order is completed.
   *  Creates one 'buyer_payment' + one 'manual_profit' record. */
  async createFromCompletedOrder(params: {
    sellerId: string;
    orderId: string;
    totalPKR: number;
    commission: number;
    popAmount: number;
    agreedRatePer10k: number;
    supplierRatePer10k?: number;
    buyerName: string;
  }): Promise<void> {
    const {
      sellerId, orderId, totalPKR, commission, popAmount,
      agreedRatePer10k, supplierRatePer10k, buyerName,
    } = params;

    const supplierRate = supplierRatePer10k ?? agreedRatePer10k;
    const profitPKR = Math.round(
      ((agreedRatePer10k - supplierRate) / 10_000) * popAmount - commission,
    );

    await this.create({
      sellerId,
      orderId,
      type: 'buyer_payment',
      amountPKR: totalPKR,
      profitPKR: Math.max(0, profitPKR),
      description: `Order from ${buyerName} — ${popAmount.toLocaleString()} POP`,
      paymentMethod: 'manual_transfer',
      buyerRate: agreedRatePer10k,
      supplierRate,
      popAmount,
      isManual: false,
    });
  },
};
