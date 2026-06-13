import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useOpenBuyerRequests } from '@/features/requests/hooks/useRequests';
import { useCreateDirectOrder } from '@/features/orders/hooks/useOrders';
import { calcTotalPKR } from '@/features/orders/services/orderService';
import { LoadingScreen } from '@/shared/components';
import type { SellerRequest } from '@/shared/types';

function RequestCard({
  request,
  onOrder,
}: {
  request: SellerRequest;
  onOrder: () => void;
}) {
  const totalPKR = calcTotalPKR(request.totalPopAmount, request.ratePer10k);
  const pctBooked = Math.max(0, Math.min(100,
    (1 - request.remainingAmount / request.totalPopAmount) * 100,
  ));

  return (
    <View className="bg-surface-100 rounded-2xl p-4 mb-3 mx-4">
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="text-white font-bold text-xl">
            {request.totalPopAmount.toLocaleString()} POP
          </Text>
          <Text className="text-surface-300 text-sm">by {request.sellerName}</Text>
        </View>
        <View className="items-end">
          <Text className="text-primary-400 font-bold text-lg">
            PKR {request.ratePer10k}/10k
          </Text>
          <Text className="text-surface-300 text-xs">
            Total ≈ PKR {totalPKR.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Availability bar */}
      <View className="mb-3">
        <View className="flex-row justify-between mb-1">
          <Text className="text-surface-300 text-xs">Availability</Text>
          <Text className="text-surface-300 text-xs">
            {request.remainingAmount.toLocaleString()} POP remaining
          </Text>
        </View>
        <View className="bg-surface-200 rounded-full h-1.5 overflow-hidden">
          <View
            className="bg-primary-500 h-full rounded-full"
            style={{ width: `${100 - pctBooked}%` }}
          />
        </View>
      </View>

      {request.notes && (
        <View className="bg-surface-200 rounded-lg p-2 mb-3">
          <Text className="text-surface-300 text-xs">{request.notes}</Text>
        </View>
      )}

      <TouchableOpacity
        className="bg-primary-500 rounded-xl py-3 items-center"
        onPress={onOrder}
      >
        <Text className="text-white font-bold">Place Order</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BuyerBrowseScreen() {
  const { user } = useAuth();
  const { requests, isLoading } = useOpenBuyerRequests();
  const { mutate: createOrder, isPending: ordering } = useCreateDirectOrder();

  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SellerRequest | null>(null);
  const [pubgId, setPubgId] = useState(user?.pubgId ?? '');
  const [amountType, setAmountType] = useState<'full' | 'custom'>('full');
  const [customAmount, setCustomAmount] = useState('');
  const [deliveryType, setDeliveryType] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledTime, setScheduledTime] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);

  const filtered = requests.filter((r: SellerRequest) =>
    r.sellerName.toLowerCase().includes(search.toLowerCase()) ||
    String(r.ratePer10k).includes(search),
  );

  const getOrderAmount = () => {
    if (!selectedRequest) return 0;
    if (amountType === 'full') return selectedRequest.remainingAmount;
    const n = Number(customAmount.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const handleOpenOrder = (request: SellerRequest) => {
    setPubgId(user?.pubgId ?? '');
    setAmountType('full');
    setCustomAmount('');
    setDeliveryType('instant');
    setScheduledTime('');
    setOrderError(null);
    setSelectedRequest(request);
  };

  const handleConfirmOrder = () => {
    if (!selectedRequest || !user) return;
    if (!pubgId.trim() || pubgId.trim().length < 3) {
      setOrderError('Enter your PUBG ID (min 3 chars)');
      return;
    }
    const orderAmount = getOrderAmount();
    if (!orderAmount || orderAmount < 1000) {
      setOrderError('Minimum order is 1,000 POP');
      return;
    }
    if (orderAmount > selectedRequest.remainingAmount) {
      setOrderError(`Only ${selectedRequest.remainingAmount.toLocaleString()} POP available`);
      return;
    }
    if (deliveryType === 'scheduled' && !scheduledTime.trim()) {
      setOrderError('Enter your preferred delivery time');
      return;
    }

    createOrder(
      {
        listingId: selectedRequest.id,
        supplierId: selectedRequest.sellerId,
        supplierName: selectedRequest.sellerName,
        buyerId: user.uid,
        buyerName: user.displayName,
        targetPubgId: pubgId.trim(),
        popAmount: orderAmount,
        agreedRatePer10k: selectedRequest.ratePer10k,
        deliveryType,
        deliveryNote: deliveryType === 'scheduled' ? scheduledTime.trim() : null,
        notes: `Ordered from seller request ${selectedRequest.id}`,
      },
      {
        onSuccess: (orderId) => {
          setSelectedRequest(null);
          router.push(`/orders/${orderId}` as never);
        },
        onError: (e) =>
          setOrderError(e instanceof Error ? e.message : 'Failed to place order'),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold mb-3">Browse POP</Text>
        <TextInput
          className="bg-surface-100 text-white rounded-xl px-4 py-3 text-sm"
          placeholder="Search by seller or rate..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      {isLoading ? (
        <LoadingScreen variant="market" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard request={item} onOrder={() => handleOpenOrder(item)} />
          )}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 32, flexGrow: 1 }} // eslint-disable-line react-native/no-inline-styles
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text className="text-surface-300 text-base mb-1">No POP available right now</Text>
              <Text className="text-surface-400 text-sm">Check back soon — sellers post new requests regularly.</Text>
            </View>
          }
        />
      )}

      {/* Order modal */}
      <Modal
        visible={!!selectedRequest}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          {/* eslint-disable-next-line react-native/no-inline-styles */}
          <ScrollView style={{ maxHeight: '90%' }} bounces={false}>
            <View className="bg-surface rounded-t-3xl p-6">
              <Text className="text-white text-xl font-bold mb-1">Place Order</Text>
              {selectedRequest && (
                <Text className="text-surface-300 text-sm mb-5">
                  from {selectedRequest.sellerName} · PKR {selectedRequest.ratePer10k}/10k
                </Text>
              )}

              {/* PUBG ID */}
              <View className="mb-4">
                <Text className="text-surface-300 text-sm mb-2">Your PUBG ID <Text className="text-red-400">*</Text></Text>
                <TextInput
                  className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                  value={pubgId}
                  onChangeText={(v) => { setPubgId(v); setOrderError(null); }}
                  placeholder="e.g. 5123456789"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Amount selector */}
              <View className="mb-4">
                <Text className="text-surface-300 text-sm mb-2">POP Amount</Text>
                <View className="flex-row gap-3 mb-3">
                  <TouchableOpacity
                    onPress={() => { setAmountType('full'); setOrderError(null); }}
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${
                      amountType === 'full' ? 'border-primary-500 bg-primary-500/10' : 'border-surface-200 bg-surface-100'
                    }`}
                  >
                    <Text className={`text-sm font-bold ${
                      amountType === 'full' ? 'text-primary-400' : 'text-surface-300'
                    }`}>All Available</Text>
                    {selectedRequest && (
                      <Text className={`text-xs mt-0.5 ${
                        amountType === 'full' ? 'text-primary-400/70' : 'text-surface-400'
                      }`}>{selectedRequest.remainingAmount.toLocaleString()} POP</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setAmountType('custom'); setOrderError(null); }}
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${
                      amountType === 'custom' ? 'border-primary-500 bg-primary-500/10' : 'border-surface-200 bg-surface-100'
                    }`}
                  >
                    <Text className={`text-sm font-bold ${
                      amountType === 'custom' ? 'text-primary-400' : 'text-surface-300'
                    }`}>Custom Amount</Text>
                    <Text className={`text-xs mt-0.5 ${
                      amountType === 'custom' ? 'text-primary-400/70' : 'text-surface-400'
                    }`}>enter below</Text>
                  </TouchableOpacity>
                </View>
                {amountType === 'custom' && (
                  <TextInput
                    className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                    value={customAmount}
                    onChangeText={(v) => { setCustomAmount(v); setOrderError(null); }}
                    placeholder={`max ${selectedRequest?.remainingAmount.toLocaleString() ?? ''}`}
                    placeholderTextColor="#475569"
                    keyboardType="numeric"
                    autoCorrect={false}
                  />
                )}
              </View>

              {/* Delivery type */}
              <View className="mb-4">
                <Text className="text-surface-300 text-sm mb-2">Delivery Preference</Text>
                <View className="flex-row gap-3 mb-2">
                  <TouchableOpacity
                    onPress={() => { setDeliveryType('instant'); setOrderError(null); }}
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${
                      deliveryType === 'instant' ? 'border-green-500 bg-green-500/10' : 'border-surface-200 bg-surface-100'
                    }`}
                  >
                    <Text className="text-xl mb-0.5">⚡</Text>
                    <Text className={`text-sm font-bold ${
                      deliveryType === 'instant' ? 'text-green-400' : 'text-surface-300'
                    }`}>Instant</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setDeliveryType('scheduled'); setOrderError(null); }}
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${
                      deliveryType === 'scheduled' ? 'border-yellow-500 bg-yellow-500/10' : 'border-surface-200 bg-surface-100'
                    }`}
                  >
                    <Text className="text-xl mb-0.5">🕐</Text>
                    <Text className={`text-sm font-bold ${
                      deliveryType === 'scheduled' ? 'text-yellow-400' : 'text-surface-300'
                    }`}>Scheduled</Text>
                  </TouchableOpacity>
                </View>
                {deliveryType === 'scheduled' && (
                  <TextInput
                    className="bg-surface-100 text-white rounded-xl px-4 py-3 text-base"
                    value={scheduledTime}
                    onChangeText={(v) => { setScheduledTime(v); setOrderError(null); }}
                    placeholder="e.g. tonight 9pm, within 3 hours"
                    placeholderTextColor="#475569"
                    autoCorrect={false}
                  />
                )}
              </View>

              {/* Summary */}
              {selectedRequest && getOrderAmount() > 0 && (
                <View className="bg-surface-100 rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between py-1">
                    <Text className="text-surface-300 text-sm">POP Amount</Text>
                    <Text className="text-white text-sm font-semibold">{getOrderAmount().toLocaleString()}</Text>
                  </View>
                  <View className="flex-row justify-between py-1 border-t border-surface-200 mt-1">
                    <Text className="text-surface-300 text-sm">Total PKR</Text>
                    <Text className="text-primary-400 font-bold">
                      PKR {calcTotalPKR(getOrderAmount(), selectedRequest.ratePer10k).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              {orderError && (
                <View className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-4">
                  <Text className="text-red-400 text-sm">{orderError}</Text>
                </View>
              )}

              <View className="flex-row gap-3 pb-2">
                <TouchableOpacity
                  className="flex-1 bg-surface-200 rounded-xl py-4 items-center"
                  onPress={() => setSelectedRequest(null)}
                  disabled={ordering}
                >
                  <Text className="text-white font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 rounded-xl py-4 items-center ${ordering ? 'bg-surface-200' : 'bg-primary-500'}`}
                  onPress={handleConfirmOrder}
                  disabled={ordering}
                >
                  <Text className="text-white font-bold">
                    {ordering ? 'Placing…' : 'Confirm Order'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
