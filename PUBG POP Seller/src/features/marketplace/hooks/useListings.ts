import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants';
import type { Listing, ListingStatus } from '@/shared/types';

import { listingService, type CreateListingInput } from '../services/listingService';

/** All active listings sorted by best rate — for the marketplace feed */
export function useActiveListings(limitCount = 30) {
  return useQuery({
    queryKey: [QUERY_KEYS.LISTINGS, 'active', limitCount],
    queryFn: () => listingService.getActive(limitCount),
    staleTime: 30_000, // re-fetch every 30s to keep rates fresh
  });
}

/** All listings belonging to a specific supplier */
export function useSupplierListings(supplierId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.LISTINGS, 'supplier', supplierId],
    queryFn: () => listingService.getBySupplier(supplierId!),
    enabled: !!supplierId,
  });
}

/** Single listing by ID */
export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.LISTING, id],
    queryFn: () => listingService.getById(id!),
    enabled: !!id,
  });
}

/** Create a new POP listing */
export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListingInput) => listingService.create(data),
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LISTINGS] });
      // Also invalidate supplier's own listing list
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LISTINGS, 'supplier', vars.supplierId] });
    },
  });
}

/** Update listing fields */
export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Listing, 'id' | 'createdAt'>> }) =>
      listingService.update(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LISTINGS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LISTING, id] });
    },
  });
}

/** Change listing status (active → sold_out or expired) */
export function useSetListingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) =>
      listingService.setStatus(id, status),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LISTINGS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LISTING, id] });
    },
  });
}

/** Hard delete a listing */
export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LISTINGS] });
    },
  });
}
