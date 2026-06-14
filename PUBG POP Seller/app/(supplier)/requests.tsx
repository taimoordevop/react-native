import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useOpenSupplierRequests, useCreateBooking } from '@/features/requests/hooks/useRequests';
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
  onBook,
}: {
  request: SellerRequest;
  onBook: () => void;
}) {
  const pctFilled = Math.max(0, Math.min(100,
    (1 - request.remainingAmount / request.totalPopAmount) * 100,
  ));

  return (
    <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.2)', borderRadius: 4 }} className="p-4 mb-3 mx-4">
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-white font-bold text-lg">
            {request.totalPopAmount.toLocaleString()} POP needed
          </Text>
          <Text className="text-surface-300 text-xxs mt-0.5">by {request.sellerName}</Text>
        </View>
        <View className="items-end">
          <Text className="text-green-400 font-bold text-base">
            PKR {request.ratePer10k}/10k
          </Text>
          <Text className="text-surface-400 text-[9px] uppercase mt-0.5">you earn this rate</Text>
        </View>
      </View>

      {/* Fill progress */}
      <View className="mb-4">
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-surface-300 text-[10px] font-bold uppercase">Booking progress</Text>
          <Text className="text-surface-300 text-[10px] font-bold uppercase">
            {request.remainingAmount.toLocaleString()} left
          </Text>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} className="rounded-full h-1.5 overflow-hidden">
          <View
            style={{ width: `${pctFilled}%`, backgroundColor: '#10b981' }}
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
        onPress={onBook}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }} className="uppercase">Book This Request</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SupplierRequestsScreen() {
  const { user } = useAuth();
  const { requests, isLoading } = useOpenSupplierRequests();
  const { mutate: createBooking, isPending: booking } = useCreateBooking();

  const [selected, setSelected] = useState<SellerRequest | null>(null);
  const [amount, setAmount] = useState('');
  const [deliveryTimeType, setDeliveryTimeType] = useState<'instant' | 'scheduled'>('instant');
  const [customDeliveryTime, setCustomDeliveryTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Focus states
  const [amountFocused, setAmountFocused] = useState(false);
  const [timeFocused, setTimeFocused] = useState(false);

  const handleBook = () => {
    if (!selected || !user) return;
    const amountNum = Number(amount.replace(/,/g, ''));
    if (!amountNum || amountNum < 1000) {
      setError('Minimum booking is 1,000 POP');
      return;
    }
    if (amountNum > selected.remainingAmount) {
      setError(`Only ${selected.remainingAmount.toLocaleString()} POP remaining`);
      return;
    }
    if (deliveryTimeType === 'scheduled' && !customDeliveryTime.trim()) {
      setError('Enter when you can send the POP');
      return;
    }
    const deliveryTime = deliveryTimeType === 'instant' ? 'instant' : customDeliveryTime.trim();

    createBooking(
      {
        requestId: selected.id,
        sellerId: selected.sellerId,
        supplierId: user.uid,
        supplierName: user.displayName,
        supplierPubgId: user.pubgId,
        bookedAmount: amountNum,
        deliveryTime,
      },
      {
        onSuccess: () => {
          setSelected(null);
          setAmount('');
          setDeliveryTimeType('instant');
          setCustomDeliveryTime('');
          Alert.alert(
            'Booking Submitted!',
            'The seller will review and accept/reject your booking.',
          );
        },
        onError: (e) => setError(e instanceof Error ? e.message : 'Failed to book'),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      {/* Background Overlay */}
      <TacticalGrid />

      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="px-4 pt-4 pb-3 bg-[#090d16]">
        <Text style={{ letterSpacing: 1 }} className="text-white text-base font-bold uppercase mb-1">Open Requests</Text>
        <Text className="text-surface-300 text-xxs leading-relaxed uppercase">
          Book POP amounts you can send. Seller reviews and accepts.
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A017" size="large" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              onBook={() => {
                setSelected(item);
                setAmount('');
                setError(null);
              }}
            />
          )}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text style={{ letterSpacing: 0.5 }} className="text-surface-300 text-sm mb-1 uppercase">No open requests right now</Text>
              <Text className="text-surface-400 text-xxs uppercase">Check back later</Text>
            </View>
          }
        />
      )}

      {/* Booking modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View className="flex-1 justify-end bg-black/70">
          <View style={{ backgroundColor: '#090d16', borderTopWidth: 2, borderTopColor: '#D4A017' }} className="p-6 relative">
            <CornerReticles />
            <TacticalGrid />

            <Text style={{ letterSpacing: 1 }} className="text-white text-lg font-bold uppercase mb-1">Book This Request</Text>
            {selected && (
              <Text className="text-surface-300 text-xs mb-4">
                {selected.sellerName} needs up to {selected.remainingAmount.toLocaleString()} POP
              </Text>
            )}

            {/* Destination PUBG ID (from seller's request) */}
            {selected?.destinationPubgId && (
              <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', borderWidth: 1.5, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 4 }} className="p-3 mb-4">
                <Text style={{ letterSpacing: 0.5 }} className="text-green-400 text-xxs font-bold uppercase mb-1">Send POP to this PUBG ID:</Text>
                <Text className="text-white font-bold text-base">{selected.destinationPubgId}</Text>
                {selected.deliveryDeadline && (
                  <Text className="text-green-400/80 text-[10px] mt-1 uppercase">Deadline: {selected.deliveryDeadline}</Text>
                )}
              </View>
            )}

            <View className="mb-4">
              <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">
                How much POP can you send? *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: amountFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(30,41,59,0.4)',
                  color: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                }}
                value={amount}
                onChangeText={(v) => { setAmount(v); setError(null); }}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                placeholder="e.g. 25000"
                placeholderTextColor="#475569"
                keyboardType="numeric"
                autoCorrect={false}
              />
              {selected && amount && Number(amount) > 0 && (
                <Text className="text-green-400 text-xxs mt-1.5 uppercase font-semibold">
                  You earn PKR {Math.round((Number(amount) / 10000) * selected.ratePer10k).toLocaleString()}
                </Text>
              )}
            </View>

            {/* Delivery time */}
            <View className="mb-4">
              <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">When can you send?</Text>
              <View className="flex-row gap-3 mb-2">
                <TouchableOpacity
                  onPress={() => { setDeliveryTimeType('instant'); setError(null); }}
                  style={{
                    borderWidth: 1.5,
                    borderColor: deliveryTimeType === 'instant' ? '#22c55e' : 'rgba(255,255,255,0.08)',
                    backgroundColor: deliveryTimeType === 'instant' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(30,41,59,0.4)',
                    borderRadius: 4,
                    paddingVertical: 12,
                  }}
                  className="flex-1 items-center"
                >
                  <Text className="text-lg mb-0.5">⚡</Text>
                  <Text style={{ color: deliveryTimeType === 'instant' ? '#22c55e' : '#cbd5e1', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }} className="uppercase">Instantly</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setDeliveryTimeType('scheduled'); setError(null); }}
                  style={{
                    borderWidth: 1.5,
                    borderColor: deliveryTimeType === 'scheduled' ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: deliveryTimeType === 'scheduled' ? 'rgba(212, 160, 23, 0.15)' : 'rgba(30,41,59,0.4)',
                    borderRadius: 4,
                    paddingVertical: 12,
                  }}
                  className="flex-1 items-center"
                >
                  <Text className="text-lg mb-0.5">🕐</Text>
                  <Text style={{ color: deliveryTimeType === 'scheduled' ? '#D4A017' : '#cbd5e1', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }} className="uppercase">Scheduled</Text>
                </TouchableOpacity>
              </View>
              {deliveryTimeType === 'scheduled' && (
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: timeFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(30,41,59,0.4)',
                    color: '#fff',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 14,
                  }}
                  value={customDeliveryTime}
                  onChangeText={(v) => { setCustomDeliveryTime(v); setError(null); }}
                  onFocus={() => setTimeFocused(true)}
                  onBlur={() => setTimeFocused(false)}
                  placeholder="e.g. within 1 hour, tonight 8pm"
                  placeholderTextColor="#475569"
                  autoCorrect={false}
                />
              )}
            </View>

            {error && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <Text className="text-red-400 text-xs font-medium">{error}</Text>
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
                onPress={() => setSelected(null)}
                disabled={booking}
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
                onPress={handleBook}
                disabled={booking}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }} className="uppercase">
                  {booking ? 'Booking…' : 'Submit Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
