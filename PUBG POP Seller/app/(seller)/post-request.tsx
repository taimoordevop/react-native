import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useCreateRequest } from '@/features/requests/hooks/useRequests';
import { COMMISSION_PER_10K } from '@/constants';

const POP_PRESETS = [10000, 25000, 50000, 100000, 250000, 500000];

export default function PostRequestScreen() {
  const { user } = useAuthStore();
  const { mutate: createRequest, isPending } = useCreateRequest();
  const defaultComm = user?.defaultCommissionPer10k ?? COMMISSION_PER_10K;

  const params = useLocalSearchParams<{
    buyerOrderId?: string;
    buyerPubgId?: string;
    popAmount?: string;
    rate?: string;
  }>();

  const [audience, setAudience] = useState<'buyer' | 'supplier'>('buyer');
  const [popAmount, setPopAmount] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [destinationPubgId, setDestinationPubgId] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDirectRequest, setIsDirectRequest] = useState(false);

  // Prefill states when navigated contextually from a buyer order
  useEffect(() => {
    if (params.buyerOrderId) {
      setAudience('supplier');
      if (params.popAmount) setPopAmount(params.popAmount);
      
      const initialSupplierRate = params.rate ? Math.max(0, Number(params.rate) - defaultComm) : 0;
      setRate(String(initialSupplierRate));

      if (params.buyerPubgId) setDestinationPubgId(params.buyerPubgId);
    }
  }, [params.buyerOrderId, params.popAmount, params.rate, params.buyerPubgId, defaultComm]);

  const popNum = Number(popAmount.replace(/,/g, ''));
  const rateNum = Number(rate);
  const totalPKR = popNum && rateNum ? Math.round((popNum / 10000) * rateNum) : 0;
  const supplierPays = popNum && rateNum ? Math.round((popNum / 10000) * (rateNum - defaultComm)) : 0;

  const validate = (): string | null => {
    if (!popNum || popNum < 5000) return 'Minimum POP amount is 5,000';
    if (!rateNum || rateNum < 100) return 'Rate must be at least PKR 100 per 10k';
    
    if (params.buyerOrderId) {
      const buyerRate = Number(params.rate || 0);
      if (rateNum >= buyerRate) {
        return `Supplier rate (${rateNum}) cannot be equal to or higher than the buyer rate (${buyerRate})`;
      }
    } else if (!isDirectRequest) {
      if (rateNum <= defaultComm) return `Rate must be above commission (${defaultComm}/10k)`;
    }
    return null;
  };

  const handlePost = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (!user) return;

    const buyerRateNum = params.rate ? Number(params.rate) : null;
    const commissionPer10kNum = buyerRateNum !== null ? Math.max(0, buyerRateNum - rateNum) : null;

    createRequest(
      {
        sellerId: user.uid,
        sellerName: user.displayName,
        targetAudience: audience,
        totalPopAmount: popNum,
        ratePer10k: rateNum,
        notes: notes.trim() || null,
        destinationPubgId: audience === 'supplier' ? (destinationPubgId.trim() || null) : null,
        deliveryDeadline: audience === 'supplier' ? (deliveryDeadline.trim() || null) : null,
        buyerOrderId: params.buyerOrderId || null,
        buyerPubgId: params.buyerPubgId || null,
        buyerRatePer10k: buyerRateNum,
        commissionPer10k: commissionPer10kNum,
        isDirectRequest: isDirectRequest,
      },
      {
        onSuccess: () => {
          Alert.alert(
            params.buyerOrderId ? 'Linked Request Created!' : 'Request Posted!',
            params.buyerOrderId
              ? 'Supplier request successfully created and linked to Buyer Order.'
              : audience === 'buyer'
              ? 'Buyers can now browse and order from this request.'
              : 'Suppliers can now see and book this request.',
            [
              {
                text: audience === 'buyer' ? 'View Buyer Requests' : 'View Supplier Requests',
                onPress: () =>
                  router.replace(
                    audience === 'buyer'
                      ? '/(seller)/buyer-requests'
                      : '/(seller)/supplier-requests' as never,
                  ),
              },
            ],
          );
        },
        onError: (e) => setError(e instanceof Error ? e.message : 'Failed to post request'),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-yellow-400 text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Post POP Request</Text>
        </View>

        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">

          {/* Audience selector or Linked Banner */}
          {params.buyerOrderId ? (
            <View className="mb-5 bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex-row items-center gap-3">
              <Text className="text-3xl">🏪</Text>
              <View className="flex-1">
                <Text className="text-green-400 font-bold text-sm">Fulfilling Buyer Order</Text>
                <Text className="text-surface-300 text-xs">
                  This request is automatically linked to Buyer Order #{params.buyerOrderId.slice(-6).toUpperCase()}.
                </Text>
              </View>
            </View>
          ) : (
            <View className="mb-5">
              <Text className="text-surface-300 text-sm mb-2">
                Who can see this post? <Text className="text-red-400">*</Text>
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className={`flex-1 rounded-xl p-4 border-2 items-center ${
                    audience === 'buyer' ? 'border-blue-500 bg-blue-500/10' : 'border-surface-200 bg-surface-100'
                  }`}
                  onPress={() => setAudience('buyer')}
                >
                  <Text className="text-2xl mb-1">🛒</Text>
                  <Text className={`font-bold text-sm ${audience === 'buyer' ? 'text-blue-400' : 'text-surface-300'}`}>
                    Buyers
                  </Text>
                  <Text className="text-surface-400 text-xs text-center mt-1">
                    Selling POP to buyers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 rounded-xl p-4 border-2 items-center ${
                    audience === 'supplier' ? 'border-green-500 bg-green-500/10' : 'border-surface-200 bg-surface-100'
                  }`}
                  onPress={() => setAudience('supplier')}
                >
                  <Text className="text-2xl mb-1">🏪</Text>
                  <Text className={`font-bold text-sm ${audience === 'supplier' ? 'text-green-400' : 'text-surface-300'}`}>
                    Suppliers
                  </Text>
                  <Text className="text-surface-400 text-xs text-center mt-1">
                    Sourcing POP from suppliers
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Supplier-only: destination PUBG ID + deadline */}
          {audience === 'supplier' && (
            <>
              {!params.buyerOrderId && (
                <View className="mb-5 bg-surface-100 border border-surface-200 rounded-2xl p-4 flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-white font-bold text-sm">Direct Request (No Buyer)</Text>
                    <Text className="text-surface-400 text-xs mt-1">
                      Check this if this POP is for personal use / offline deals (no platform buyer involved).
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsDirectRequest(!isDirectRequest)}
                    className={`w-12 h-7 rounded-full p-1 justify-center ${
                      isDirectRequest ? 'bg-green-500 items-end' : 'bg-slate-700 items-start'
                    }`}
                  >
                    <View className="w-5 h-5 rounded-full bg-white" />
                  </TouchableOpacity>
                </View>
              )}

              {isDirectRequest && (
                <View className="mb-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                  <Text className="text-blue-400 text-xs font-semibold mb-1">ℹ️ Direct Request Mode Enabled</Text>
                  <Text className="text-surface-300 text-xs leading-4">
                    Platform commission is 0. You will manually upload payment proof directly to the supplier inside the order screen once they book it.
                  </Text>
                </View>
              )}

              <View className="mb-5">
                <Text className="text-surface-300 text-sm mb-2">
                  Your PUBG ID (suppliers send POP here) <Text className="text-red-400">*</Text>
                </Text>
                <TextInput
                  className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                  value={destinationPubgId}
                  onChangeText={(v) => { setDestinationPubgId(v); setError(null); }}
                  placeholder="e.g. 5123456789"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View className="mb-5">
                <Text className="text-surface-300 text-sm mb-2">Delivery Deadline (optional)</Text>
                <TextInput
                  className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                  value={deliveryDeadline}
                  onChangeText={setDeliveryDeadline}
                  placeholder="e.g. within 2 hours, by tonight"
                  placeholderTextColor="#475569"
                  autoCorrect={false}
                />
              </View>
            </>
          )}

          {/* POP Amount */}
          <View className="mb-5">
            <Text className="text-surface-300 text-sm mb-2">
              Total POP Amount <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={popAmount}
              onChangeText={(v) => { setPopAmount(v); setError(null); }}
              placeholder="e.g. 100000"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              autoCorrect={false}
            />
            {/* Presets */}
            <View className="flex-row flex-wrap gap-2 mt-2">
              {POP_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => { setPopAmount(String(p)); setError(null); }}
                  className={`rounded-lg px-3 py-1.5 ${popNum === p ? 'bg-yellow-500' : 'bg-surface-200'}`}
                >
                  <Text className={`text-xs font-semibold ${popNum === p ? 'text-white' : 'text-surface-300'}`}>
                    {p >= 1000 ? `${p / 1000}k` : p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rate */}
          <View className="mb-5">
            <Text className="text-surface-300 text-sm mb-2">
              {params.buyerOrderId ? 'Supplier Rate (PKR / 10k POP)' : 'Your Rate (PKR / 10k POP)'} <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={rate}
              onChangeText={(v) => { setRate(v); setError(null); }}
              placeholder="e.g. 260"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              autoCorrect={false}
            />
            {params.buyerOrderId ? (
              <View className="mt-3 bg-surface-200 rounded-xl p-3 border border-surface-300/40">
                <Text className="text-white text-xs font-semibold mb-2">Commission Breakdown</Text>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-surface-400 text-xs">Buyer Rate:</Text>
                  <Text className="text-white text-xs font-medium">PKR {Number(params.rate || 0)} /10k</Text>
                </View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-surface-400 text-xs">Your Profit Margin (Commission):</Text>
                  <Text className="text-green-400 text-xs font-bold">
                    PKR {Math.max(0, Number(params.rate || 0) - rateNum)} /10k
                  </Text>
                </View>
                <View className="flex-row justify-between pt-1.5 border-t border-surface-300/20">
                  <Text className="text-surface-400 text-xs">Supplier Will Get:</Text>
                  <Text className="text-yellow-400 text-xs font-bold">PKR {rateNum} /10k</Text>
                </View>
              </View>
            ) : isDirectRequest ? (
              rateNum > 0 && (
                <Text className="text-blue-400 text-xs mt-1">
                  Supplier will receive PKR {rateNum}/10k POP. Platform commission is PKR 0.
                </Text>
              )
            ) : (
              rateNum > defaultComm && (
                <Text className="text-green-400/80 text-xs mt-1">
                  Supplier earns PKR {rateNum - defaultComm}/10k · Commission: PKR {defaultComm}/10k
                </Text>
              )
            )}
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-surface-300 text-sm mb-2">Notes for Suppliers (optional)</Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-3 text-base"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Send to Asia server only"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ textAlignVertical: 'top', minHeight: 80 }}
            />
          </View>

          {/* Price preview */}
          {totalPKR > 0 && (
            <View className="bg-surface-100 rounded-2xl p-4 mb-5">
              <Text className="text-white font-semibold mb-3">Order Summary</Text>
              <View className="flex-row justify-between py-2 border-b border-surface-200">
                <Text className="text-surface-300 text-sm">Total POP</Text>
                <Text className="text-white text-sm font-medium">{popNum.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-surface-200">
                <Text className="text-surface-300 text-sm">Buyer pays (total)</Text>
                <Text className="text-yellow-400 text-sm font-bold">PKR {totalPKR.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-surface-300 text-sm">Supplier earns</Text>
                <Text className="text-green-400 text-sm font-semibold">PKR {supplierPays.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Error */}
          {error && (
            <View className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-4">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          {/* Post button */}
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${isPending ? 'bg-surface-200' : 'bg-yellow-500'}`}
            onPress={handlePost}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Post Request</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
