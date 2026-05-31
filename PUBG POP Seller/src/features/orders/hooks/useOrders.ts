import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import type { Order, OrderStatus } from '@/shared/types';

import { orderService, type CreateOrderInput, type CreateDirectOrderInput } from '../services/orderService';

/** Real-time hook — subscribes to all orders for the current user */
export function useMyOrders(userId: string | undefined, role: 'buyer' | 'supplier') {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    const unsub = orderService.subscribeToMyOrders(userId, role, (data) => {
      setOrders(data);
      setIsLoading(false);
    });
    return unsub;
  }, [userId, role]);

  return { orders, isLoading };
}

/** Real-time hook — subscribes to a single order by ID */
export function useOrderLive(id: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    setIsLoading(true);
    const unsub = orderService.subscribeToOrder(id, (data) => {
      setOrder(data);
      setIsLoading(false);
    });
    return unsub;
  }, [id]);

  return { order, isLoading };
}

/** Create an order from a listing */
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => orderService.createFromListing(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
    },
  });
}

/** Create an order directly from a seller request (no Listing object needed) */
export function useCreateDirectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDirectOrderInput) => orderService.createDirect(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
    },
  });
}

/** Transition order status (buyer pays, supplier starts, etc.) */
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderService.updateStatus(id, status),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDER, id] });
    },
  });
}

/** Seller accepts a buyer order — transitions to in_progress + decrements SellerRequest */
export function useAcceptBuyerOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      requestId,
      popAmount,
    }: {
      orderId: string;
      requestId: string | null;
      popAmount: number;
    }) => orderService.acceptBuyerOrder(orderId, requestId, popAmount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.REQUESTS] });
    },
  });
}

/** Supplier submits proof entry (video or screenshot) — transitions order to proof_submitted */
export function useSubmitProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      supplierId,
      url,
      diamondsSent,
      type,
      notes,
    }: {
      orderId: string;
      supplierId: string;
      url: string;
      diamondsSent: number;
      type: 'video' | 'screenshot';
      notes?: string;
    }) => orderService.submitProof(orderId, supplierId, { url, diamondsSent, type, notes }),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDER, orderId] });
    },
  });
}

/** Verify POP proof — transitions proof_submitted → verified (seller uploads payout separately) */
export function useVerifyAndComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => orderService.verifyAndComplete(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
    },
  });
}

/** Buyer uploads payment screenshots — stays pending_payment until seller confirms */
export function useSubmitBuyerPaymentProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, imageUrls }: { orderId: string; imageUrls: string[] }) =>
      orderService.submitBuyerPaymentProof(orderId, imageUrls),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDER, orderId] });
    },
  });
}

/** Seller confirms payment received — pending_payment → in_progress */
export function useConfirmPaymentReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => orderService.confirmPaymentReceived(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
    },
  });
}

/** Seller uploads payout proof + transitions verified → completed */
export function useSubmitSellerPayoutProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, imageUrls }: { orderId: string; imageUrls: string[] }) =>
      orderService.submitSellerPayoutProof(orderId, imageUrls),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
    },
  });
}

/** Seller marks proof received via WhatsApp — transitions in_progress → proof_submitted */
export function useMarkProofReceivedViaWhatsApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => orderService.markProofReceivedViaWhatsApp(orderId),
    onSuccess: (_data, orderId) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDER, orderId] });
    },
  });
}

/** Supplier verifies receipt of payment — marks order as completed and releases money */
export function useSupplierConfirmPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => orderService.supplierConfirmPayout(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
    },
  });
}
