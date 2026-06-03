import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import { requestService, bookingService } from '@/features/requests/services/requestService';
import type { Booking, BookingStatus, RequestStatus, SellerRequest } from '@/shared/types';

// ── SellerRequest hooks ────────────────────────────────────────────────────────

/** Real-time listener for a seller's own requests */
export function useSellerRequests(sellerId: string | undefined) {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) { setIsLoading(false); return; }
    const unsub = requestService.subscribeToSellerRequests(sellerId, (data) => {
      setRequests(data);
      setIsLoading(false);
    });
    return unsub;
  }, [sellerId]);

  return { requests, isLoading };
}

/** Real-time listener for open requests targeted at buyers */
export function useOpenBuyerRequests() {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = requestService.subscribeToOpenBuyerRequests((data) => {
      setRequests(data);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  return { requests, isLoading };
}

/** Real-time listener for open requests targeted at suppliers */
export function useOpenSupplierRequests() {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = requestService.subscribeToOpenSupplierRequests((data) => {
      setRequests(data);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  return { requests, isLoading };
}

/** React Query fetch for a single request */
export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.REQUEST, id],
    queryFn: () => requestService.getById(id!),
    enabled: !!id,
  });
}

/** React Query fetch for a linked request by buyerOrderId */
export function useLinkedRequest(buyerOrderId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.REQUEST, 'linked', buyerOrderId],
    queryFn: () => requestService.getByBuyerOrderId(buyerOrderId!),
    enabled: !!buyerOrderId,
  });
}

/** Post a new seller request */
export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.REQUESTS] }),
  });
}

/** Update request status */
export function useUpdateRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      requestService.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.REQUESTS] }),
  });
}

// ── Booking hooks ──────────────────────────────────────────────────────────────

/** Real-time listener for bookings on a specific request */
export function useRequestBookings(requestId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!requestId) { setIsLoading(false); return; }
    const unsub = bookingService.subscribeToRequestBookings(requestId, (data) => {
      setBookings(data);
      setIsLoading(false);
    });
    return unsub;
  }, [requestId]);

  return { bookings, isLoading };
}

/** Real-time listener for a supplier's own bookings */
export function useSupplierBookings(supplierId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) { setIsLoading(false); return; }
    const unsub = bookingService.subscribeToSupplierBookings(supplierId, (data) => {
      setBookings(data);
      setIsLoading(false);
    });
    return unsub;
  }, [supplierId]);

  return { bookings, isLoading };
}

/** Real-time listener for a seller's bookings (bookings on their requests) */
export function useSellerBookings(sellerId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) { setIsLoading(false); return; }
    const unsub = bookingService.subscribeToSellerBookings(sellerId, (data) => {
      setBookings(data);
      setIsLoading(false);
    });
    return unsub;
  }, [sellerId]);

  return { bookings, isLoading };
}

/** Supplier creates a booking */
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.REQUESTS] });
    },
  });
}

/** Seller accepts / rejects a booking (buyerPubgId is attached on acceptance) */
export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, buyerPubgId }: { id: string; status: BookingStatus; buyerPubgId?: string | null }) =>
      bookingService.updateStatus(id, status, buyerPubgId !== undefined ? { buyerPubgId } : undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] }),
  });
}

/** Supplier submits proof for a booking */
export function useSubmitBookingProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      proofUrl,
      proofNotes,
      proofUrls,
    }: {
      id: string;
      proofUrl: string;
      proofNotes: string | null;
      proofUrls?: string[];
    }) => bookingService.submitProof(id, proofUrl, proofNotes, proofUrls),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] }),
  });
}
