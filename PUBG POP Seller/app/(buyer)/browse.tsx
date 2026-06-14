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

function TacticalGrid() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 }} pointerEvents="none">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[...Array(12)].map((_, i) => (
          <View key={i} style={{ width: 1, height: '100%', backgroundColor: '#D4A017' }} />
        ))}
      </View>
      <View style={{ justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[...Array(20)].map((_, i) => (
          <View key={i} style={{ height: 1, width: '100%', backgroundColor: '#D4A017' }} />
        ))}
      </View>
    </View>
  );
}

function CornerReticles() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <View style={{ position: 'absolute', top: 16, left: 16, width: 16, height: 16, borderLeftWidth: 2, borderTopWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', top: 16, right: 16, width: 16, height: 16, borderRightWidth: 2, borderTopWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 16, left: 16, width: 16, height: 16, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 16, right: 16, width: 16, height: 16, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
    </View>
  );
}

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
    <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.2)', borderRadius: 4 }} className="p-4 mb-3 mx-4">
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="text-white font-bold text-lg">
            {request.totalPopAmount.toLocaleString()} POP
          </Text>
          <Text className="text-surface-300 text-xxs mt-0.5">by {request.sellerName}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[#D4A017] font-bold text-base">
            PKR {request.ratePer10k}/10k
          </Text>
          <Text className="text-surface-400 text-[10px] mt-0.5">
            Total ≈ PKR {totalPKR.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Availability bar */}
      <View className="mb-4">
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-surface-300 text-[10px] font-bold uppercase">Availability</Text>
          <Text className="text-surface-300 text-[10px] font-bold uppercase">
            {request.remainingAmount.toLocaleString()} POP remaining
          </Text>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} className="rounded-full h-1.5 overflow-hidden">
          <View
            style={{ width: `${100 - pctBooked}%`, backgroundColor: '#D4A017' }}
            className="h-full rounded-full"
          />
        </View>
      </View>

      {request.notes && (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }} className="rounded p-2.5 mb-4">
          <Text className="text-surface-300 text-xxs leading-relaxed">{request.notes}</Text>
        </View>
      )}

      <TouchableOpacity
        style={{
          borderWidth: 1.5,
          borderColor: '#D4A017',
          borderRadius: 2,
          backgroundColor: 'rgba(212, 160, 23, 0.15)',
          paddingVertical: 12,
          alignItems: 'center',
        }}
        onPress={onOrder}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }} className="uppercase">Place Order</Text>
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

  // Focus states
  const [searchFocused, setSearchFocused] = useState(false);
  const [pubgIdFocused, setPubgIdFocused] = useState(false);
  const [customFocused, setCustomFocused] = useState(false);
  const [scheduleFocused, setScheduleFocused] = useState(false);

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
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      {/* Background Overlay */}
      <TacticalGrid />

      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="px-4 pt-4 pb-3 bg-[#090d16]">
        <Text style={{ letterSpacing: 1 }} className="text-white text-base font-bold uppercase mb-3">Browse POP Marketplace</Text>
        <TextInput
          style={{
            borderWidth: 1.5,
            borderColor: searchFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(30,41,59,0.4)',
            color: '#fff',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 13,
          }}
          placeholder="Search by seller or rate..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
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
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text className="text-surface-300 text-sm mb-1 uppercase">No POP available right now</Text>
              <Text className="text-surface-400 text-xxs text-center px-6 leading-relaxed uppercase">Check back soon — sellers post new requests regularly.</Text>
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
        <View className="flex-1 justify-end bg-black/70">
          <ScrollView style={{ maxHeight: '90%' }} bounces={false}>
            <View style={{ backgroundColor: '#090d16', borderTopWidth: 2, borderTopColor: '#D4A017' }} className="p-6 relative">
              <CornerReticles />
              <TacticalGrid />

              <Text style={{ letterSpacing: 1 }} className="text-white text-lg font-bold uppercase mb-1">Place Order</Text>
              {selectedRequest && (
                <Text className="text-surface-300 text-xs mb-5">
                  from {selectedRequest.sellerName} · PKR {selectedRequest.ratePer10k}/10k
                </Text>
              )}

              {/* PUBG ID */}
              <View className="mb-4">
                <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">Your PUBG ID *</Text>
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: pubgIdFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(30,41,59,0.4)',
                    color: '#fff',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                  }}
                  value={pubgId}
                  onChangeText={(v) => { setPubgId(v); setOrderError(null); }}
                  onFocus={() => setPubgIdFocused(true)}
                  onBlur={() => setPubgIdFocused(false)}
                  placeholder="e.g. 5123456789"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Amount selector */}
              <View className="mb-4">
                <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">POP Amount</Text>
                <View className="flex-row gap-3 mb-3">
                  <TouchableOpacity
                    onPress={() => { setAmountType('full'); setOrderError(null); }}
                    style={{
                      borderWidth: 1.5,
                      borderColor: amountType === 'full' ? '#D4A017' : 'rgba(255,255,255,0.08)',
                      backgroundColor: amountType === 'full' ? 'rgba(212, 160, 23, 0.15)' : 'rgba(30,41,59,0.4)',
                      borderRadius: 4,
                      paddingVertical: 12,
                    }}
                    className="flex-1 items-center"
                  >
                    <Text style={{ color: amountType === 'full' ? '#D4A017' : '#cbd5e1', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 }} className="uppercase">All Available</Text>
                    {selectedRequest && (
                      <Text style={{ color: amountType === 'full' ? 'rgba(212, 160, 23, 0.7)' : '#94a3b8', fontSize: 10, marginTop: 2 }}>
                        {selectedRequest.remainingAmount.toLocaleString()} POP
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setAmountType('custom'); setOrderError(null); }}
                    style={{
                      borderWidth: 1.5,
                      borderColor: amountType === 'custom' ? '#D4A017' : 'rgba(255,255,255,0.08)',
                      backgroundColor: amountType === 'custom' ? 'rgba(212, 160, 23, 0.15)' : 'rgba(30,41,59,0.4)',
                      borderRadius: 4,
                      paddingVertical: 12,
                    }}
                    className="flex-1 items-center"
                  >
                    <Text style={{ color: amountType === 'custom' ? '#D4A017' : '#cbd5e1', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 }} className="uppercase">Custom Amount</Text>
                    <Text style={{ color: amountType === 'custom' ? 'rgba(212, 160, 23, 0.7)' : '#94a3b8', fontSize: 10, marginTop: 2 }} className="uppercase">enter below</Text>
                  </TouchableOpacity>
                </View>
                {amountType === 'custom' && (
                  <TextInput
                    style={{
                      borderWidth: 1.5,
                      borderColor: customFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(30,41,59,0.4)',
                      color: '#fff',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 15,
                    }}
                    value={customAmount}
                    onChangeText={(v) => { setCustomAmount(v); setOrderError(null); }}
                    onFocus={() => setCustomFocused(true)}
                    onBlur={() => setCustomFocused(false)}
                    placeholder={`max ${selectedRequest?.remainingAmount.toLocaleString() ?? ''}`}
                    placeholderTextColor="#475569"
                    keyboardType="numeric"
                    autoCorrect={false}
                  />
                )}
              </View>

              {/* Delivery type */}
              <View className="mb-4">
                <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">Delivery Preference</Text>
                <View className="flex-row gap-3 mb-2">
                  <TouchableOpacity
                    onPress={() => { setDeliveryType('instant'); setOrderError(null); }}
                    style={{
                      borderWidth: 1.5,
                      borderColor: deliveryType === 'instant' ? '#22c55e' : 'rgba(255,255,255,0.08)',
                      backgroundColor: deliveryType === 'instant' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(30,41,59,0.4)',
                      borderRadius: 4,
                      paddingVertical: 12,
                    }}
                    className="flex-1 items-center"
                  >
                    <Text className="text-lg mb-0.5">⚡</Text>
                    <Text style={{ color: deliveryType === 'instant' ? '#22c55e' : '#cbd5e1', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }} className="uppercase">Instant</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setDeliveryType('scheduled'); setOrderError(null); }}
                    style={{
                      borderWidth: 1.5,
                      borderColor: deliveryType === 'scheduled' ? '#D4A017' : 'rgba(255,255,255,0.08)',
                      backgroundColor: deliveryType === 'scheduled' ? 'rgba(212, 160, 23, 0.15)' : 'rgba(30,41,59,0.4)',
                      borderRadius: 4,
                      paddingVertical: 12,
                    }}
                    className="flex-1 items-center"
                  >
                    <Text className="text-lg mb-0.5">🕐</Text>
                    <Text style={{ color: deliveryType === 'scheduled' ? '#D4A017' : '#cbd5e1', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }} className="uppercase">Scheduled</Text>
                  </TouchableOpacity>
                </View>
                {deliveryType === 'scheduled' && (
                  <TextInput
                    style={{
                      borderWidth: 1.5,
                      borderColor: scheduleFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(30,41,59,0.4)',
                      color: '#fff',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 14,
                    }}
                    value={scheduledTime}
                    onChangeText={(v) => { setScheduledTime(v); setOrderError(null); }}
                    onFocus={() => setScheduleFocused(true)}
                    onBlur={() => setScheduleFocused(false)}
                    placeholder="e.g. tonight 9pm, within 3 hours"
                    placeholderTextColor="#475569"
                    autoCorrect={false}
                  />
                )}
              </View>

              {/* Summary */}
              {selectedRequest && getOrderAmount() > 0 && (
                <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.45)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-5">
                  <View className="flex-row justify-between py-1">
                    <Text className="text-surface-300 text-xs font-bold uppercase">POP Amount</Text>
                    <Text className="text-white text-xs font-bold">{getOrderAmount().toLocaleString()}</Text>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }} className="flex-row justify-between py-2 mt-2">
                    <Text className="text-[#D4A017] text-xs font-bold uppercase">Total PKR</Text>
                    <Text className="text-[#D4A017] font-bold text-sm">
                      PKR {calcTotalPKR(getOrderAmount(), selectedRequest.ratePer10k).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              {orderError && (
                <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5">
                  <Text className="text-red-400 text-xs font-medium">{orderError}</Text>
                </View>
              )}

              <View className="flex-row gap-3 pb-4">
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    backgroundColor: 'rgba(30,41,59,0.4)',
                    paddingVertical: 14,
                  }}
                  className="flex-1 items-center"
                  onPress={() => setSelectedRequest(null)}
                  disabled={ordering}
                >
                  <Text style={{ letterSpacing: 1 }} className="text-white font-bold text-xs uppercase">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#D4A017',
                    borderRadius: 2,
                    backgroundColor: 'rgba(212, 160, 23, 0.15)',
                    paddingVertical: 14,
                  }}
                  className="flex-1 items-center"
                  onPress={handleConfirmOrder}
                  disabled={ordering}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }} className="uppercase">
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
