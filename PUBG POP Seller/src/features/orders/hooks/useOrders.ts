import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import type { Order } from '@/shared/types';

import { orderService } from '../services/orderService';

export function useSellerOrders(sellerId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.ORDERS, 'seller', sellerId],
    queryFn: () => orderService.getBySeller(sellerId!),
    enabled: !!sellerId,
  });
}

export function useBuyerOrders(buyerId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.ORDERS, 'buyer', buyerId],
    queryFn: () => orderService.getByBuyer(buyerId!),
    enabled: !!buyerId,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.ORDER, id],
    queryFn: () => orderService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) =>
      orderService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      extra,
    }: {
      id: string;
      status: Order['status'];
      extra?: Partial<Order>;
    }) => orderService.updateStatus(id, status, extra),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDER, id] });
    },
  });
}
