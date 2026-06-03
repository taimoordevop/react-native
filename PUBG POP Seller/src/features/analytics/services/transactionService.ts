import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

import { COLLECTION } from '@/constants';
import { db } from '@/lib/firebase';
import type { Transaction, TransactionType } from '@/shared/types';

export interface CreateTransactionInput {
  sellerId: string;
  orderId: string | null;
  buyerOrderId?: string;
  supplierRequestId?: string;
  type: TransactionType;
  amountPKR: number;
  profitPKR: number;
  description: string;
  paymentMethod: string;
  buyerRate?: number;
  buyerRatePer10k?: number;
  supplierRate?: number;
  supplierRatePer10k?: number;
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
      ...((input.buyerOrderId || input.orderId) ? { buyerOrderId: input.buyerOrderId || (input.orderId as string) } : {}),
      ...(input.supplierRequestId ? { supplierRequestId: input.supplierRequestId } : {}),
      ...(input.buyerRate !== undefined ? { buyerRate: input.buyerRate, buyerRatePer10k: input.buyerRate } : {}),
      ...(input.buyerRatePer10k !== undefined ? { buyerRatePer10k: input.buyerRatePer10k, buyerRate: input.buyerRatePer10k } : {}),
      ...(input.supplierRate !== undefined ? { supplierRate: input.supplierRate, supplierRatePer10k: input.supplierRate } : {}),
      ...(input.supplierRatePer10k !== undefined ? { supplierRatePer10k: input.supplierRatePer10k, supplierRate: input.supplierRatePer10k } : {}),
      ...(input.popAmount !== undefined ? { popAmount: input.popAmount } : {}),
      ...(input.proofUrl ? { proofUrl: input.proofUrl } : {}),
    };
    const ref = await addDoc(collection(db, COLLECTION.TRANSACTIONS), doc);
    return ref.id;
  },

  /** Fetch all transactions for a seller, newest first, client-side sorted to avoid compound index requirements */
  async getBySeller(sellerId: string, limitCount = 200): Promise<Transaction[]> {
    // Proactively backfill any completed orders that are missing transaction records
    try {
      const ordersQ = query(
        collection(db, COLLECTION.ORDERS),
        where('supplierId', '==', sellerId),
        where('status', '==', 'completed')
      );
      const ordersSnap = await getDocs(ordersQ);
      if (!ordersSnap.empty) {
        const txnsQ = query(
          collection(db, COLLECTION.TRANSACTIONS),
          where('sellerId', '==', sellerId)
        );
        const txnsSnap = await getDocs(txnsQ);
        const existingOrderIds = new Set(
          txnsSnap.docs
            .map((d) => d.data().orderId)
            .filter((id) => !!id)
        );

        for (const orderDoc of ordersSnap.docs) {
          if (!existingOrderIds.has(orderDoc.id)) {
            const orderData = orderDoc.data();
            console.log(`[Backfill] Creating transactions for completed order ${orderDoc.id}`);
            await this.createFromCompletedOrder({
              sellerId: sellerId,
              orderId: orderDoc.id,
              totalPKR: orderData.totalPKR || 0,
              commission: orderData.commission || 0,
              popAmount: orderData.popAmount || 0,
              agreedRatePer10k: orderData.agreedRatePer10k || 0,
              buyerName: orderData.buyerName || 'Buyer',
            });
            // Add to Set to prevent duplicate creations in same loop
            existingOrderIds.add(orderDoc.id);
          }
        }
      }
    } catch (err) {
      console.error('[transactionService] Failed to backfill completed order transactions:', err);
    }

    const q = query(
      collection(db, COLLECTION.TRANSACTIONS),
      where('sellerId', '==', sellerId),
      limit(limitCount),
    );
    const snap = await getDocs(q);
    const txns = snap.docs.map((d) => toTransaction(d.id, d.data() as Record<string, unknown>));

    // Sort client-side: newest first
    txns.sort((a, b) => {
      const aMs = (a.date && typeof a.date === 'object' && 'seconds' in a.date)
        ? (a.date as any).seconds * 1000
        : 0;
      const bMs = (b.date && typeof b.date === 'object' && 'seconds' in b.date)
        ? (b.date as any).seconds * 1000
        : 0;
      return bMs - aMs;
    });

    return txns;
  },

  /** Compute profit summary from a list of transactions */
  summarise(txns: Transaction[]): ProfitSummary {
    return txns.reduce(
      (acc, t) => {
        const isRevenueTxn = t.type === 'buyer_payment' || t.type === 'manual' || t.type === 'manual_profit';
        const isProfitTxn = t.type === 'seller_profit' || t.type === 'manual' || t.type === 'manual_profit';
        return {
          totalProfit: acc.totalProfit + t.profitPKR,
          totalRevenue: acc.totalRevenue + (isRevenueTxn ? t.amountPKR : 0),
          transactionCount: acc.transactionCount + (isProfitTxn ? 1 : 0),
        };
      },
      { totalProfit: 0, totalRevenue: 0, transactionCount: 0 },
    );
  },

  /** Auto-create profit transactions when an in-app order is completed.
   *  Creates 3 transactions: buyer_payment, supplier_payout (if cost > 0), and seller_profit. */
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

    const finalSellerId = sellerId || '';
    const finalOrderId = orderId || '';
    const finalBuyerName = buyerName || 'Buyer';
    const finalTotalPKR = totalPKR || 0;
    const finalCommission = commission || 0;
    const finalPopAmount = popAmount || 0;
    const finalAgreedRatePer10k = agreedRatePer10k || 0;

    let supplierRate = supplierRatePer10k ?? 0;
    let supplierRequestId: string | undefined;

    try {
      // Find linked Supplier Request to get supplier rate
      if (finalOrderId) {
        const q = query(
          collection(db, COLLECTION.REQUESTS),
          where('buyerOrderId', '==', finalOrderId),
          where('targetAudience', '==', 'supplier'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const reqDoc = snap.docs[0];
          const reqData = reqDoc.data();
          supplierRate = reqData.ratePer10k || 0;
          supplierRequestId = reqDoc.id;
        }
      }
    } catch (err) {
      console.error('Error finding linked supplier request for transaction:', err);
    }

    const revenue = finalTotalPKR;
    const cost = Math.round((supplierRate / 10_000) * finalPopAmount);
    const profit = Math.round(revenue - cost - finalCommission);

    // 1. Buyer Payment (positive revenue, 0 profit)
    await this.create({
      sellerId: finalSellerId,
      orderId: finalOrderId,
      buyerOrderId: finalOrderId,
      supplierRequestId,
      type: 'buyer_payment',
      amountPKR: revenue,
      profitPKR: 0,
      description: `Buyer Payment: Order from ${finalBuyerName} — ${finalPopAmount.toLocaleString()} POP`,
      paymentMethod: 'manual_transfer',
      buyerRate: finalAgreedRatePer10k,
      buyerRatePer10k: finalAgreedRatePer10k,
      supplierRate,
      supplierRatePer10k: supplierRate,
      popAmount: finalPopAmount,
      isManual: false,
    });

    // 2. Supplier Payout (negative cost, 0 profit) - only if cost > 0
    if (cost > 0) {
      await this.create({
        sellerId: finalSellerId,
        orderId: finalOrderId,
        buyerOrderId: finalOrderId,
        supplierRequestId,
        type: 'supplier_payout',
        amountPKR: -cost,
        profitPKR: 0,
        description: `Supplier Payout: POP Cost for Order #${finalOrderId}`,
        paymentMethod: 'manual_transfer',
        buyerRate: finalAgreedRatePer10k,
        buyerRatePer10k: finalAgreedRatePer10k,
        supplierRate,
        supplierRatePer10k: supplierRate,
        popAmount: finalPopAmount,
        isManual: false,
      });
    }

    // 3. Seller Profit (positive profit)
    await this.create({
      sellerId: finalSellerId,
      orderId: finalOrderId,
      buyerOrderId: finalOrderId,
      supplierRequestId,
      type: 'seller_profit',
      amountPKR: profit,
      profitPKR: profit,
      description: `Net Profit: Order from ${finalBuyerName} — ${finalPopAmount.toLocaleString()} POP`,
      paymentMethod: 'manual_transfer',
      buyerRate: finalAgreedRatePer10k,
      buyerRatePer10k: finalAgreedRatePer10k,
      supplierRate,
      supplierRatePer10k: supplierRate,
      popAmount: finalPopAmount,
      isManual: false,
    });
  },
};
