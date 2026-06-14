import * as ImagePicker from 'expo-image-picker';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useLogTransaction } from '@/features/analytics/hooks/useAnalytics';
import { orderService } from '@/features/orders/services/orderService';

const PAYMENT_METHODS = ['JazzCash', 'EasyPaisa', 'Bank Transfer', 'Cash', 'WhatsApp'];

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

export default function LogManualDealScreen() {
  const { user } = useAuthStore();
  const logTransaction = useLogTransaction();
  const params = useLocalSearchParams<{
    popAmount?: string;
    buyerRate?: string;
    supplierRate?: string;
    description?: string;
    orderId?: string;
  }>();

  const [popAmount, setPopAmount]       = useState(params.popAmount || '');
  const [buyerRate, setBuyerRate]       = useState(params.buyerRate || params.supplierRate || '');
  const [supplierRate, setSupplierRate] = useState(params.supplierRate || '');
  const [description, setDescription]  = useState(params.description || '');
  const [payMethod, setPayMethod]       = useState('JazzCash');
  const [proofUri, setProofUri]         = useState<string | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Focus states
  const [popFocused, setPopFocused] = useState(false);
  const [buyerFocused, setBuyerFocused] = useState(false);
  const [supplierFocused, setSupplierFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  const pop    = parseInt(popAmount.replace(/,/g, ''), 10) || 0;
  const bRate  = parseFloat(buyerRate)   || 0;
  const sRate  = parseFloat(supplierRate) || 0;
  const profit = pop > 0 && bRate > 0 && sRate > 0
    ? Math.round(((bRate - sRate) / 10_000) * pop)
    : 0;
  const revenue = pop > 0 && bRate > 0
    ? Math.round((bRate / 10_000) * pop)
    : 0;

  const pickProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo library access to attach proof.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setProofUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!popAmount.trim() || pop < 1) {
      setError('Enter POP amount.');
      return;
    }
    if (!buyerRate.trim() || bRate < 1) {
      setError('Enter buyer rate per 10k.');
      return;
    }
    if (!supplierRate.trim() || sRate < 1) {
      setError('Enter supplier rate per 10k.');
      return;
    }
    if (!description.trim()) {
      setError('Enter a description (e.g. "WhatsApp deal with Ahmed").');
      return;
    }

    setError(null);

    try {
      setUploading(true);
      let uploadedProofUrl: string | undefined;
      if (proofUri) {
        uploadedProofUrl = await orderService.uploadProofImage(
          'manual',
          user.uid,
          proofUri,
        );
      }

      logTransaction.mutate(
        {
          sellerId: user.uid,
          orderId: params.orderId || null,
          type: 'manual',
          amountPKR: revenue,
          profitPKR: profit,
          description: description.trim(),
          paymentMethod: payMethod.toLowerCase().replace(' ', '_'),
          buyerRate: bRate,
          buyerRatePer10k: bRate,
          supplierRate: sRate,
          supplierRatePer10k: sRate,
          popAmount: pop,
          proofUrl: uploadedProofUrl,
          isManual: true,
        },
        {
          onSuccess: () => {
            Alert.alert(
              'Deal Logged ✓',
              `PKR ${profit.toLocaleString()} profit recorded.`,
              [{ text: 'OK', onPress: () => router.back() }],
            );
          },
          onError: (e) =>
            setError(e instanceof Error ? e.message : 'Failed to log deal'),
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#090d16]">
      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-sm font-bold uppercase">← BACK</Text>
        </TouchableOpacity>
        <Text style={{ letterSpacing: 1 }} className="text-white text-base font-bold flex-1 uppercase">LOG MANUAL DEAL</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Background Overlay */}
        <TacticalGrid />
        <CornerReticles />

        {/* Info banner */}
        <View style={{ backgroundColor: 'rgba(212, 160, 23, 0.08)', borderWidth: 1.5, borderColor: 'rgba(212, 160, 23, 0.3)', borderRadius: 4 }} className="p-4 mb-5">
          <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] font-bold mb-1 uppercase">📱 WhatsApp / Offline Deal</Text>
          <Text className="text-surface-300 text-xxs leading-relaxed">
            Log deals made outside the app — WhatsApp, phone, or in-person. Profit is auto-calculated from rates.
          </Text>
        </View>

        {/* POP Amount */}
        <View className="mb-4">
          <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">POP AMOUNT *</Text>
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: popFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(30,41,59,0.4)',
              color: '#fff',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
            }}
            value={popAmount}
            onChangeText={(v) => { setPopAmount(v); setError(null); }}
            onFocus={() => setPopFocused(true)}
            onBlur={() => setPopFocused(false)}
            placeholder="e.g. 50000"
            placeholderTextColor="#475569"
            keyboardType="numeric"
          />
        </View>

        {/* Rates row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">Buyer Rate / 10k *</Text>
            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: buyerFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(30,41,59,0.4)',
                color: '#fff',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
              }}
              value={buyerRate}
              onChangeText={(v) => { setBuyerRate(v); setError(null); }}
              onFocus={() => setBuyerFocused(true)}
              onBlur={() => setBuyerFocused(false)}
              placeholder="e.g. 280"
              placeholderTextColor="#475569"
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">Supplier Rate / 10k *</Text>
            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: supplierFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(30,41,59,0.4)',
                color: '#fff',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
              }}
              value={supplierRate}
              onChangeText={(v) => { setSupplierRate(v); setError(null); }}
              onFocus={() => setSupplierFocused(true)}
              onBlur={() => setSupplierFocused(false)}
              placeholder="e.g. 260"
              placeholderTextColor="#475569"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Live profit preview */}
        {pop > 0 && bRate > 0 && sRate > 0 && (
          <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', borderWidth: 1.5, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 4 }} className="p-4 mb-4">
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-surface-300 text-xs uppercase">Revenue (from buyer)</Text>
              <Text className="text-white text-xs font-semibold">PKR {revenue.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-surface-300 text-xs uppercase">Cost (to supplier)</Text>
              <Text className="text-red-400 text-xs font-semibold">
                PKR {Math.round((sRate / 10_000) * pop).toLocaleString()}
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} className="h-px my-2" />
            <View className="flex-row justify-between items-center">
              <Text className="text-green-400 font-bold text-xs uppercase">Net Profit</Text>
              <Text className="text-green-400 font-bold text-lg">
                PKR {profit.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Description */}
        <View className="mb-4">
          <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">Description *</Text>
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: descFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(30,41,59,0.4)',
              color: '#fff',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 14,
              minHeight: 64,
              textAlignVertical: 'top',
            }}
            value={description}
            onChangeText={(v) => { setDescription(v); setError(null); }}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            placeholder="e.g. WhatsApp deal with Ahmed — 50k POP"
            placeholderTextColor="#475569"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Payment method */}
        <View className="mb-4">
          <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 pb-1">
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPayMethod(m)}
                  style={{
                    borderWidth: 1,
                    borderColor: payMethod === m ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: payMethod === m ? 'rgba(212, 160, 23, 0.15)' : 'rgba(30,41,59,0.4)',
                    borderRadius: 4,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: payMethod === m ? '#D4A017' : '#cbd5e1',
                      fontSize: 11,
                      fontWeight: 'bold',
                      letterSpacing: 1,
                    }}
                    className="uppercase"
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Proof screenshot (optional) */}
        <View className="mb-6">
          <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">Proof Screenshot (optional)</Text>
          {proofUri ? (
            <View className="relative">
              <Image
                source={{ uri: proofUri }}
                style={{ width: '100%', height: 160, borderRadius: 4 }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setProofUri(null)}
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }}
                className="absolute top-2 right-2 rounded-full w-7 h-7 items-center justify-center"
              >
                <Text className="text-white text-xs font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickProof}
              style={{
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: 'rgba(212,160,23,0.3)',
                backgroundColor: 'rgba(30,41,59,0.25)',
                borderRadius: 4,
                paddingVertical: 24,
                alignItems: 'center',
              }}
            >
              <Text className="text-surface-300 text-2xl mb-1">📷</Text>
              <Text style={{ letterSpacing: 1 }} className="text-surface-400 text-xxs font-bold uppercase">Attach screenshot</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Error */}
        {error && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <Text className="text-red-400 text-xs font-medium">{error}</Text>
          </View>
        )}

        {/* Submit */}
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
          onPress={handleSubmit}
          disabled={logTransaction.isPending || uploading}
          activeOpacity={0.8}
        >
          {logTransaction.isPending || uploading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#D4A017" size="small" />
              <Text style={{ color: '#D4A017', fontWeight: 'bold', fontSize: 13, letterSpacing: 1.5 }} className="uppercase">
                {uploading ? 'Uploading…' : 'Saving…'}
              </Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1.5 }} className="uppercase">
              ✓ Log Deal — PKR {profit > 0 ? profit.toLocaleString() : '0'} Profit
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
