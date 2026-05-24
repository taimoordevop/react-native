import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';

import { QUERY_KEYS } from '@/constants';
import type { Transaction } from '@/shared/types';

import {
  transactionService,
  type CreateTransactionInput,
  type ProfitSummary,
} from '../services/transactionService';

export interface AnalyticsSummary {
  today: ProfitSummary;
  thisWeek: ProfitSummary;
  thisMonth: ProfitSummary;
  all: ProfitSummary;
  recent: Transaction[];
}

function emptyProfitSummary(): ProfitSummary {
  return { totalProfit: 0, totalRevenue: 0, transactionCount: 0 };
}

/** Main hook — loads all seller transactions and computes period summaries */
export function useAnalytics(sellerId: string | undefined) {
  return useQuery<AnalyticsSummary>({
    queryKey: [QUERY_KEYS.TRANSACTIONS, sellerId],
    enabled: !!sellerId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!sellerId) {
        return {
          today: emptyProfitSummary(),
          thisWeek: emptyProfitSummary(),
          thisMonth: emptyProfitSummary(),
          all: emptyProfitSummary(),
          recent: [],
        };
      }

      const allTxns = await transactionService.getBySeller(sellerId, 200);

      const nowMs = Date.now();
      const todayMs = startOfDay(nowMs).getTime();
      const weekMs = startOfWeek(nowMs, { weekStartsOn: 1 }).getTime();
      const monthMs = startOfMonth(nowMs).getTime();

      const filter = (since: number) =>
        allTxns.filter((t) => {
          const tsMs =
            typeof t.date === 'object' && 'seconds' in t.date
              ? (t.date as { seconds: number }).seconds * 1000
              : 0;
          return tsMs >= since;
        });

      return {
        today: transactionService.summarise(filter(todayMs)),
        thisWeek: transactionService.summarise(filter(weekMs)),
        thisMonth: transactionService.summarise(filter(monthMs)),
        all: transactionService.summarise(allTxns),
        recent: allTxns.slice(0, 20),
      };
    },
  });
}

/** Mutation hook — log a manual or automatic transaction */
export function useLogTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => transactionService.create(input),
    onSuccess: (_id, input) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS, input.sellerId] });
    },
  });
}
