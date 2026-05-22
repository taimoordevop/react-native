import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useListing, useSetListingStatus } from '@/features/marketplace/hooks/useListings';
import { useCreateOrder } from '@/features/orders/hooks/useOrders';
import { calcTotalPKR, calcCommission } from '@/features/orders/services/orderService';

/** Formats a POP amount: 50000 → "50,000" */
function formatPop(amount: number): string {
  return amount.toLocaleString();
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: listing, isLoading, isError } = useListing(id);
  const setStatus = useSetListingStatus();
  const createOrder = useCreateOrder();

  // Order modal state
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [popInput, setPopInput] = useState('');
  const [pubgId, setPubgId] = useState(user?.pubgId ?? '');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);

  const isOwner = user?.uid === listing?.supplierId;
  const isActive = listing?.status === 'active';

  const openOrderModal = () => {
    if (!user?.pubgId && !pubgId) setPubgId('');
    setPopInput(String(listing?.minAmount ?? 10000));
    setOrderError(null);
    setOrderModalVisible(true);
  };

  const popAmount = parseInt(popInput, 10) || 0;
  const previewPKR = listing ? calcTotalPKR(popAmount, listing.ratePer10k) : 0;
  const previewCommission = calcCommission(popAmount);

  const handleConfirmOrder = () => {
    if (!listing || !user) return;
    if (!pubgId.trim()) {
      setOrderError('Your PUBG ID is required');
      return;
    }
    if (popAmount < listing.minAmount) {
      setOrderError(`Minimum order is ${listing.minAmount.toLocaleString()} POP`);
      return;
    }
    if (listing.totalAvailable !== null && popAmount > listing.totalAvailable) {
      setOrderError(`Maximum available is ${listing.totalAvailable.toLocaleString()} POP`);
      return;
    }

    createOrder.mutate(
      {
        listing,
        buyerId: user.uid,
        buyerName: user.displayName,
        targetPubgId: pubgId.trim(),
        popAmount,
        notes: orderNotes.trim() || undefined,
      },
      {
        onSuccess: (orderId) => {
          setOrderModalVisible(false);
          router.push(`/orders/${orderId}` as never);
        },
        onError: (err) => {
          setOrderError(err instanceof Error ? err.message : 'Failed to create order');
        },
      },
    );
  };

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

  const totalPkr = calcTotalPKR(listing.popAmount, listing.ratePer10k);

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
              onPress={openOrderModal}
            >
              <Text className="text-white font-bold text-base">Place Order</Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* ── Order Creation Modal ── */}
      <Modal
        visible={orderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-3xl p-6">
            <Text className="text-white text-xl font-bold mb-1">Place Order</Text>
            <Text className="text-surface-300 text-sm mb-5">
              {listing?.supplierName} · PKR {listing?.ratePer10k}/10k POP
            </Text>

            {/* POP Amount */}
            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-2">POP Amount *</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                value={popInput}
                onChangeText={(v) => { setPopInput(v); setOrderError(null); }}
                placeholder={`Min ${listing?.minAmount.toLocaleString()} POP`}
                placeholderTextColor="#475569"
                keyboardType="numeric"
              />
            </View>

            {/* PUBG ID */}
            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-2">Your PUBG ID *</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                value={pubgId}
                onChangeText={(v) => { setPubgId(v); setOrderError(null); }}
                placeholder="Enter your PUBG ID"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Notes */}
            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-2">Notes (optional)</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-3 text-sm"
                value={orderNotes}
                onChangeText={setOrderNotes}
                placeholder="Any special instructions..."
                placeholderTextColor="#475569"
                multiline
                numberOfLines={2}
                // eslint-disable-next-line react-native/no-inline-styles
                style={{ minHeight: 60, textAlignVertical: 'top' }}
              />
            </View>

            {/* Price Preview */}
            {popAmount > 0 && (
              <View className="bg-surface-100 rounded-xl p-3 mb-4 flex-row justify-between">
                <View>
                  <Text className="text-surface-300 text-xs">Total PKR</Text>
                  <Text className="text-white font-bold text-lg">
                    PKR {previewPKR.toLocaleString()}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-surface-300 text-xs">Commission</Text>
                  <Text className="text-yellow-400 text-sm font-medium">
                    PKR {previewCommission.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {orderError && (
              <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm">{orderError}</Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-surface-200 rounded-xl py-4 items-center"
                onPress={() => setOrderModalVisible(false)}
                disabled={createOrder.isPending}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-4 items-center ${
                  createOrder.isPending ? 'bg-surface-200' : 'bg-primary-500'
                }`}
                onPress={handleConfirmOrder}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Confirm Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
