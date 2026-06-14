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

  // Focus states
  const [destFocused, setDestFocused] = useState(false);
  const [deadlineFocused, setDeadlineFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [rateFocused, setRateFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

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
    <SafeAreaView className="flex-1 bg-[#090d16]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-sm font-bold uppercase">← BACK</Text>
          </TouchableOpacity>
          <Text style={{ letterSpacing: 1 }} className="text-white text-base font-bold uppercase">POST POP REQUEST</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          {/* Background Overlay */}
          <TacticalGrid />
          <CornerReticles />

          {/* Audience selector or Linked Banner */}
          {params.buyerOrderId ? (
            <View 
              style={{
                borderWidth: 1.5,
                borderColor: 'rgba(34, 197, 94, 0.3)',
                borderRadius: 4,
                backgroundColor: 'rgba(34, 197, 94, 0.08)',
                padding: 16,
                marginBottom: 20,
              }}
              className="flex-row items-center gap-3"
            >
              <Text className="text-3xl">🏪</Text>
              <View className="flex-1">
                <Text style={{ letterSpacing: 1 }} className="text-green-400 font-bold text-xs uppercase">Fulfilling Buyer Order</Text>
                <Text className="text-surface-300 text-xs mt-0.5">
                  This request is automatically linked to Buyer Order #{params.buyerOrderId.slice(-6).toUpperCase()}.
                </Text>
              </View>
            </View>
          ) : (
            <View className="mb-5">
              <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-3">
                TARGET AUDIENCE <Text className="text-red-400">*</Text>
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  style={{
                    flex: 1,
                    borderWidth: 1.5,
                    borderColor: audience === 'buyer' ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: audience === 'buyer' ? 'rgba(212, 160, 23, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                    borderRadius: 4,
                    padding: 16,
                    alignItems: 'center',
                  }}
                  onPress={() => setAudience('buyer')}
                >
                  <Text className="text-2xl mb-1">🛒</Text>
                  <Text style={{ letterSpacing: 1 }} className={`font-bold text-xs uppercase ${audience === 'buyer' ? 'text-[#D4A017]' : 'text-surface-300'}`}>
                    Buyers
                  </Text>
                  <Text className="text-surface-400 text-xxs text-center mt-1">
                    Selling POP directly to buyers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    borderWidth: 1.5,
                    borderColor: audience === 'supplier' ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: audience === 'supplier' ? 'rgba(212, 160, 23, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                    borderRadius: 4,
                    padding: 16,
                    alignItems: 'center',
                  }}
                  onPress={() => setAudience('supplier')}
                >
                  <Text className="text-2xl mb-1">🏪</Text>
                  <Text style={{ letterSpacing: 1 }} className={`font-bold text-xs uppercase ${audience === 'supplier' ? 'text-[#D4A017]' : 'text-surface-300'}`}>
                    Suppliers
                  </Text>
                  <Text className="text-surface-400 text-xxs text-center mt-1">
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
                <View 
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 4,
                    padding: 16,
                    marginBottom: 20,
                  }}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <Text style={{ letterSpacing: 1 }} className="text-white font-bold text-xs uppercase">Direct Request (No Buyer)</Text>
                    <Text className="text-surface-400 text-xxs mt-1">
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
                <View 
                  style={{
                    borderWidth: 1.5,
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    borderRadius: 4,
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ letterSpacing: 1 }} className="text-green-400 text-xs font-bold uppercase mb-1">ℹ️ Direct Request Mode Enabled</Text>
                  <Text className="text-surface-300 text-xxs leading-4">
                    Platform commission is 0. You will manually upload payment proof directly to the supplier inside the order screen once they book it.
                  </Text>
                </View>
              )}

              <View className="mb-5">
                <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">
                  YOUR PUBG ID (SUPPLIERS SEND POP HERE) <Text className="text-red-400">*</Text>
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: destFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(30,41,59,0.4)',
                    color: '#fff',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                  }}
                  value={destinationPubgId}
                  onChangeText={(v) => { setDestinationPubgId(v); setError(null); }}
                  onFocus={() => setDestFocused(true)}
                  onBlur={() => setDestFocused(false)}
                  placeholder="e.g. 5123456789"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View className="mb-5">
                <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">DELIVERY DEADLINE (OPTIONAL)</Text>
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: deadlineFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(30,41,59,0.4)',
                    color: '#fff',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                  }}
                  value={deliveryDeadline}
                  onChangeText={setDeliveryDeadline}
                  onFocus={() => setDeadlineFocused(true)}
                  onBlur={() => setDeadlineFocused(false)}
                  placeholder="e.g. within 2 hours, by tonight"
                  placeholderTextColor="#475569"
                  autoCorrect={false}
                />
              </View>
            </>
          )}

          {/* POP Amount */}
          <View className="mb-5">
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">
              TOTAL POP AMOUNT <Text className="text-red-400">*</Text>
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
              value={popAmount}
              onChangeText={(v) => { setPopAmount(v); setError(null); }}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
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
                  style={{
                    borderWidth: 1,
                    borderColor: popNum === p ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: popNum === p ? 'rgba(212, 160, 23, 0.15)' : 'rgba(30,41,59,0.4)',
                    borderRadius: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{
                    color: popNum === p ? '#D4A017' : '#cbd5e1',
                    fontSize: 11,
                    fontWeight: 'bold',
                  }}>
                    {p >= 1000 ? `${p / 1000}k` : p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rate */}
          <View className="mb-5">
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">
              {params.buyerOrderId ? 'SUPPLIER RATE (PKR / 10k POP)' : 'YOUR RATE (PKR / 10K POP)'} <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: rateFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(30,41,59,0.4)',
                color: '#fff',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
              }}
              value={rate}
              onChangeText={(v) => { setRate(v); setError(null); }}
              onFocus={() => setRateFocused(true)}
              onBlur={() => setRateFocused(false)}
              placeholder="e.g. 260"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              autoCorrect={false}
            />
            {params.buyerOrderId ? (
              <View style={{ backgroundColor: 'rgba(30,41,59,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="mt-3 p-3">
                <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-bold uppercase mb-2">Commission Breakdown</Text>
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
                <View className="flex-row justify-between pt-1.5 border-t border-surface-200/20">
                  <Text className="text-surface-400 text-xs">Supplier Will Get:</Text>
                  <Text className="text-[#D4A017] text-xs font-bold">PKR {rateNum} /10k</Text>
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
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">NOTES FOR SUPPLIERS (OPTIONAL)</Text>
            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: notesFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(30,41,59,0.4)',
                color: '#fff',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                textAlignVertical: 'top',
                minHeight: 80,
              }}
              value={notes}
              onChangeText={setNotes}
              onFocus={() => setNotesFocused(true)}
              onBlur={() => setNotesFocused(false)}
              placeholder="e.g. Send to Asia server only"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Price preview */}
          {totalPKR > 0 && (
            <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4 mb-5">
              <Text style={{ letterSpacing: 1 }} className="text-white font-bold text-xs uppercase mb-3">Order Summary</Text>
              <View className="flex-row justify-between py-2 border-b border-surface-200/20">
                <Text className="text-surface-400 text-xs uppercase">Total POP</Text>
                <Text className="text-white text-xs font-semibold">{popNum.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-surface-200/20">
                <Text className="text-surface-400 text-xs uppercase">Buyer pays (total)</Text>
                <Text className="text-[#D4A017] text-xs font-bold">PKR {totalPKR.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-surface-400 text-xs uppercase">Supplier earns</Text>
                <Text className="text-green-400 text-xs font-bold">PKR {supplierPays.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Error */}
          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <Text className="text-red-400 text-xs font-medium">{error}</Text>
            </View>
          )}

          {/* Post button */}
          <TouchableOpacity
            style={{
              borderWidth: 1.5,
              borderColor: '#D4A017',
              borderRadius: 2,
              backgroundColor: 'rgba(212, 160, 23, 0.15)',
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: '#D4A017',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={handlePost}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator color="#D4A017" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 2 }}>
                {params.buyerOrderId ? 'CONFIRM LINKED REQUEST' : 'DEPLOY REQUEST PROTOCOL'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
