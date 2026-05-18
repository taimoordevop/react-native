import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useSetListingStatus } from '@/features/marketplace/hooks/useListings';
import { useListing } from '@/features/marketplace/hooks/useListings';

/** Formats a POP amount: 50000 → "50,000" */
function formatPop(amount: number): string {
  return amount.toLocaleString();
}

/** Calculates total PKR: popAmount * (ratePer10k / 10000) */
function calcTotalPkr(popAmount: number, ratePer10k: number): number {
  return Math.round((popAmount / 10_000) * ratePer10k);
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: listing, isLoading, isError } = useListing(id);
  const setStatus = useSetListingStatus();

  const isOwner = user?.uid === listing?.supplierId;
  const isActive = listing?.status === 'active';

  const handleMarkSoldOut = () => {
    if (!listing) return;
    Alert.alert(
      'Mark as Sold Out',
      'This will hide the listing from the marketplace.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () =>
            setStatus.mutate(
              { id: listing.id, status: 'sold_out' },
              { onSuccess: () => router.back() },
            ),
        },
      ],
    );
  };

  const handlePlaceOrder = () => {
    // Orders chunk will implement this — placeholder for now
    Alert.alert('Coming Soon', 'Order flow will be implemented in the next chunk.');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#6366f1" size="large" />
      </SafeAreaView>
    );
  }

  if (isError || !listing) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-red-400 text-base text-center mb-4">
          Listing not found or an error occurred.
        </Text>
        <TouchableOpacity className="bg-surface-100 rounded-xl px-6 py-3" onPress={() => router.back()}>
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalPkr = calcTotalPkr(listing.popAmount, listing.ratePer10k);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* ── Header ── */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">Listing Detail</Text>
        {listing.status !== 'active' && (
          <View className="bg-red-500/20 px-3 py-1 rounded-full">
            <Text className="text-red-400 text-xs font-semibold">
              {listing.status === 'sold_out' ? 'Sold Out' : 'Expired'}
            </Text>
          </View>
        )}
      </View>

      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* ── Supplier info ── */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-surface-300 text-xs mb-1">Supplier</Text>
          <Text className="text-white text-xl font-bold">{listing.supplierName}</Text>
          {listing.supplierPubgNickname ? (
            <Text className="text-primary-400 text-sm mt-1">
              PUBG: {listing.supplierPubgNickname}
            </Text>
          ) : null}
        </View>

        {/* ── Hero: POP amount ── */}
        <View className="bg-primary-500/10 border border-primary-500/30 rounded-2xl p-5 mb-4 items-center">
          <Text className="text-surface-300 text-sm mb-1">Available POP</Text>
          <Text className="text-primary-400 text-5xl font-bold">
            {formatPop(listing.popAmount)}
          </Text>
          <Text className="text-primary-300 text-lg mt-1">POP</Text>
        </View>

        {/* ── Pricing grid ── */}
        <View className="flex-row gap-3 mb-4">
          {[
            { label: 'Rate / 10k POP', value: `PKR ${listing.ratePer10k.toLocaleString()}` },
            { label: 'Total Price', value: `PKR ${totalPkr.toLocaleString()}` },
          ].map(({ label, value }) => (
            <View key={label} className="flex-1 bg-surface-100 rounded-xl p-4">
              <Text className="text-surface-300 text-xs mb-2">{label}</Text>
              <Text className="text-white font-bold text-base">{value}</Text>
            </View>
          ))}
        </View>

        {/* ── Min order & total available ── */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Order Rules</Text>
          <View className="flex-row justify-between py-2 border-b border-surface-200">
            <Text className="text-surface-300 text-sm">Minimum Order</Text>
            <Text className="text-white text-sm font-semibold">
              {formatPop(listing.minAmount)} POP
            </Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-surface-300 text-sm">Total Available</Text>
            <Text className="text-white text-sm font-semibold">
              {listing.totalAvailable != null
                ? `${formatPop(listing.totalAvailable)} POP`
                : 'Unlimited'}
            </Text>
          </View>
        </View>

        {/* ── Rate info note ── */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-6">
          <Text className="text-surface-300 text-xs leading-5">
            Prices are in PKR (Pakistani Rupees). Rate is quoted per 10,000 POP.
            Payments and escrow will be handled in the order flow.
          </Text>
        </View>

        {/* ── CTA ── */}
        {isOwner ? (
          <View className="gap-3">
            {isActive && (
              <TouchableOpacity
                className="bg-red-500/20 border border-red-500/30 rounded-2xl py-4 items-center"
                onPress={handleMarkSoldOut}
                disabled={setStatus.isPending}
              >
                {setStatus.isPending ? (
                  <ActivityIndicator color="#f87171" />
                ) : (
                  <Text className="text-red-400 font-semibold">Mark as Sold Out</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="bg-surface-200 rounded-2xl py-4 items-center"
              onPress={() => router.back()}
            >
              <Text className="text-white font-semibold">Back to My Listings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          isActive && (
            <TouchableOpacity
              className="bg-primary-500 rounded-2xl py-4 items-center"
              onPress={handlePlaceOrder}
            >
              <Text className="text-white font-bold text-base">Place Order</Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
