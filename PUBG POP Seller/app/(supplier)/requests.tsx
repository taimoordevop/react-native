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
    <View className="bg-surface-100 rounded-2xl p-4 mb-3 mx-4">
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-white font-bold text-xl">
            {request.totalPopAmount.toLocaleString()} POP needed
          </Text>
          <Text className="text-surface-300 text-sm">by {request.sellerName}</Text>
        </View>
        <View className="items-end">
          <Text className="text-green-400 font-bold text-lg">
            PKR {request.ratePer10k}/10k
          </Text>
          <Text className="text-surface-300 text-xs">you earn this rate</Text>
        </View>
      </View>

      {/* Fill progress */}
      <View className="mb-3">
        <View className="flex-row justify-between mb-1">
          <Text className="text-surface-300 text-xs">Booking progress</Text>
          <Text className="text-surface-300 text-xs">
            {request.remainingAmount.toLocaleString()} left
          </Text>
        </View>
        <View className="bg-surface-200 rounded-full h-1.5 overflow-hidden">
          <View
            className="bg-green-500 h-full rounded-full"
            style={{ width: `${pctFilled}%` }}
          />
        </View>
      </View>

      {request.notes && (
        <View className="bg-surface-200 rounded-lg p-2 mb-3">
          <Text className="text-surface-300 text-xs">{request.notes}</Text>
        </View>
      )}

      <TouchableOpacity
        className="bg-green-600 rounded-xl py-3 items-center"
        onPress={onBook}
      >
        <Text className="text-white font-bold">Book This Request</Text>
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
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold mb-1">Open Requests</Text>
        <Text className="text-surface-300 text-sm">
          Book POP amounts you can send. Seller reviews and accepts.
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#10b981" size="large" />
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
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 32, flexGrow: 1 }} // eslint-disable-line react-native/no-inline-styles
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text className="text-surface-300 text-base">No open requests right now</Text>
              <Text className="text-surface-400 text-sm mt-1">Check back later</Text>
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
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-3xl p-6">
            <Text className="text-white text-xl font-bold mb-1">Book This Request</Text>
            {selected && (
              <Text className="text-surface-300 text-sm mb-5">
                {selected.sellerName} needs up to {selected.remainingAmount.toLocaleString()} POP
              </Text>
            )}

                {/* Destination PUBG ID (from seller's request) */}
            {selected?.destinationPubgId && (
              <View className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
                <Text className="text-green-400 text-xs font-semibold mb-0.5">Send POP to this PUBG ID:</Text>
                <Text className="text-white font-bold text-base">{selected.destinationPubgId}</Text>
                {selected.deliveryDeadline && (
                  <Text className="text-green-400/80 text-xs mt-1">Deadline: {selected.deliveryDeadline}</Text>
                )}
              </View>
            )}

            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-2">
                How much POP can you send?
              </Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                value={amount}
                onChangeText={(v) => { setAmount(v); setError(null); }}
                placeholder="e.g. 25000"
                placeholderTextColor="#475569"
                keyboardType="numeric"
                autoCorrect={false}
              />
              {selected && amount && Number(amount) > 0 && (
                <Text className="text-green-400 text-xs mt-1">
                  You earn PKR {Math.round((Number(amount) / 10000) * selected.ratePer10k).toLocaleString()}
                </Text>
              )}
            </View>

            {/* Delivery time */}
            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-2">When can you send?</Text>
              <View className="flex-row gap-3 mb-2">
                <TouchableOpacity
                  onPress={() => { setDeliveryTimeType('instant'); setError(null); }}
                  className={`flex-1 py-3 rounded-xl items-center border-2 ${
                    deliveryTimeType === 'instant' ? 'border-green-500 bg-green-500/10' : 'border-surface-200 bg-surface-100'
                  }`}
                >
                  <Text className="text-lg mb-0.5">⚡</Text>
                  <Text className={`text-xs font-bold ${
                    deliveryTimeType === 'instant' ? 'text-green-400' : 'text-surface-300'
                  }`}>Instantly</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setDeliveryTimeType('scheduled'); setError(null); }}
                  className={`flex-1 py-3 rounded-xl items-center border-2 ${
                    deliveryTimeType === 'scheduled' ? 'border-yellow-500 bg-yellow-500/10' : 'border-surface-200 bg-surface-100'
                  }`}
                >
                  <Text className="text-lg mb-0.5">🕐</Text>
                  <Text className={`text-xs font-bold ${
                    deliveryTimeType === 'scheduled' ? 'text-yellow-400' : 'text-surface-300'
                  }`}>Scheduled</Text>
                </TouchableOpacity>
              </View>
              {deliveryTimeType === 'scheduled' && (
                <TextInput
                  className="bg-surface-100 text-white rounded-xl px-4 py-3 text-base"
                  value={customDeliveryTime}
                  onChangeText={(v) => { setCustomDeliveryTime(v); setError(null); }}
                  placeholder="e.g. within 1 hour, tonight 8pm"
                  placeholderTextColor="#475569"
                  autoCorrect={false}
                />
              )}
            </View>

            {error && (
              <View className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            )}

              <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-surface-200 rounded-xl py-4 items-center"
                onPress={() => setSelected(null)}
                disabled={booking}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-4 items-center ${booking ? 'bg-surface-200' : 'bg-green-600'}`}
                onPress={handleBook}
                disabled={booking}
              >
                <Text className="text-white font-bold">
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
