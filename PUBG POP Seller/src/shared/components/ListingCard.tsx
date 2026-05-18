import { router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';

import type { Listing } from '@/shared/types';

interface ListingCardProps {
  listing: Listing;
  /** Show supplier management actions (mark sold out, delete) */
  isOwner?: boolean;
  onMarkSoldOut?: (id: string) => void;
}

/** Formats a POP amount to a readable string: 50000 → "50k" */
function formatPop(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return String(amount);
}

/** Calculates total PKR price: popAmount * (ratePer10k / 10000) */
function calcTotalPkr(popAmount: number, ratePer10k: number): number {
  return Math.round((popAmount / 10_000) * ratePer10k);
}

const STATUS_BADGE: Record<Listing['status'], { label: string; bg: string; text: string }> = {
  active: { label: 'Active', bg: 'bg-green-500/20', text: 'text-green-400' },
  expired: { label: 'Expired', bg: 'bg-surface-200', text: 'text-surface-300' },
  sold_out: { label: 'Sold Out', bg: 'bg-red-500/20', text: 'text-red-400' },
};

export function ListingCard({ listing, isOwner = false, onMarkSoldOut }: ListingCardProps) {
  const badge = STATUS_BADGE[listing.status];
  const totalPkr = calcTotalPkr(listing.popAmount, listing.ratePer10k);
  const isAvailable = listing.status === 'active';

  return (
    <TouchableOpacity
      className="bg-surface-100 rounded-2xl p-4 mb-3 border border-surface-200"
      activeOpacity={0.85}
      onPress={() => router.push(`/listing/${listing.id}` as never)}
      disabled={!isAvailable && !isOwner}
    >
      {/* ── Header: supplier name + status badge ── */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-white font-semibold text-base" numberOfLines={1}>
            {listing.supplierName}
          </Text>
          {listing.supplierPubgNickname ? (
            <Text className="text-surface-300 text-xs">
              PUBG: {listing.supplierPubgNickname}
            </Text>
          ) : null}
        </View>
        <View className={`px-3 py-1 rounded-full ${badge.bg}`}>
          <Text className={`text-xs font-semibold ${badge.text}`}>{badge.label}</Text>
        </View>
      </View>

      {/* ── POP Amount (hero stat) ── */}
      <View className="flex-row items-end gap-1 mb-3">
        <Text className="text-primary-400 text-3xl font-bold">
          {formatPop(listing.popAmount)}
        </Text>
        <Text className="text-primary-300 text-base mb-1">POP</Text>
      </View>

      {/* ── Rate grid ── */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 bg-surface-200 rounded-xl p-3">
          <Text className="text-surface-300 text-xs mb-1">Rate / 10k</Text>
          <Text className="text-white font-bold text-sm">
            PKR {listing.ratePer10k.toLocaleString()}
          </Text>
        </View>
        <View className="flex-1 bg-surface-200 rounded-xl p-3">
          <Text className="text-surface-300 text-xs mb-1">Total Price</Text>
          <Text className="text-white font-bold text-sm">
            PKR {totalPkr.toLocaleString()}
          </Text>
        </View>
        <View className="flex-1 bg-surface-200 rounded-xl p-3">
          <Text className="text-surface-300 text-xs mb-1">Min Order</Text>
          <Text className="text-white font-bold text-sm">
            {formatPop(listing.minAmount)} POP
          </Text>
        </View>
      </View>

      {/* ── Footer: CTA or owner actions ── */}
      {isOwner ? (
        <View className="flex-row gap-2">
          {listing.status === 'active' && onMarkSoldOut && (
            <TouchableOpacity
              className="flex-1 bg-surface-200 rounded-xl py-2 items-center"
              onPress={() => onMarkSoldOut(listing.id)}
            >
              <Text className="text-surface-300 text-xs font-semibold">Mark Sold Out</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        isAvailable && (
          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-3 items-center"
            onPress={() => router.push(`/listing/${listing.id}` as never)}
          >
            <Text className="text-white font-semibold text-sm">View & Order</Text>
          </TouchableOpacity>
        )
      )}
    </TouchableOpacity>
  );
}
