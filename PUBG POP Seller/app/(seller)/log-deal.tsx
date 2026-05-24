import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
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

export default function LogDealScreen() {
  const { user } = useAuthStore();
  const logTransaction = useLogTransaction();

  const [popAmount, setPopAmount]       = useState('');
  const [buyerRate, setBuyerRate]       = useState('');
  const [supplierRate, setSupplierRate] = useState('');
  const [description, setDescription]  = useState('');
  const [payMethod, setPayMethod]       = useState('JazzCash');
  const [proofUri, setProofUri]         = useState<string | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

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
          orderId: null,
          type: 'manual_profit',
          amountPKR: revenue,
          profitPKR: profit,
          description: description.trim(),
          paymentMethod: payMethod.toLowerCase().replace(' ', '_'),
          buyerRate: bRate,
          supplierRate: sRate,
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
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-yellow-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">Log Manual Deal</Text>
      </View>

      <ScrollView
        /* eslint-disable-next-line react-native/no-inline-styles */
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-5">
          <Text className="text-yellow-400 font-semibold mb-1">📱 WhatsApp / Offline Deal</Text>
          <Text className="text-surface-300 text-sm leading-5">
            Log deals made outside the app — WhatsApp, phone, or in-person.
            Profit is auto-calculated from rates.
          </Text>
        </View>

        {/* POP Amount */}
        <View className="mb-4">
          <Text className="text-surface-300 text-sm mb-2">POP Amount *</Text>
          <TextInput
            className="bg-surface-100 text-white rounded-xl px-4 py-3 text-base"
            value={popAmount}
            onChangeText={(v) => { setPopAmount(v); setError(null); }}
            placeholder="e.g. 50000"
            placeholderTextColor="#475569"
            keyboardType="numeric"
          />
        </View>

        {/* Rates row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-surface-300 text-sm mb-2">Buyer Rate / 10k *</Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-3 text-base"
              value={buyerRate}
              onChangeText={(v) => { setBuyerRate(v); setError(null); }}
              placeholder="e.g. 280"
              placeholderTextColor="#475569"
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-surface-300 text-sm mb-2">Supplier Rate / 10k *</Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-3 text-base"
              value={supplierRate}
              onChangeText={(v) => { setSupplierRate(v); setError(null); }}
              placeholder="e.g. 260"
              placeholderTextColor="#475569"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Live profit preview */}
        {pop > 0 && bRate > 0 && sRate > 0 && (
          <View className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-surface-300 text-sm">Revenue (from buyer)</Text>
              <Text className="text-white font-semibold">PKR {revenue.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-surface-300 text-sm">Cost (to supplier)</Text>
              <Text className="text-red-400 font-semibold">
                PKR {Math.round((sRate / 10_000) * pop).toLocaleString()}
              </Text>
            </View>
            <View className="h-px bg-surface-200 my-2" />
            <View className="flex-row justify-between">
              <Text className="text-green-400 font-bold text-base">Net Profit</Text>
              <Text className="text-green-400 font-bold text-lg">
                PKR {profit.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Description */}
        <View className="mb-4">
          <Text className="text-surface-300 text-sm mb-2">Description *</Text>
          <TextInput
            className="bg-surface-100 text-white rounded-xl px-4 py-3 text-sm"
            value={description}
            onChangeText={(v) => { setDescription(v); setError(null); }}
            placeholder="e.g. WhatsApp deal with Ahmed — 50k POP"
            placeholderTextColor="#475569"
            multiline
            numberOfLines={2}
            /* eslint-disable-next-line react-native/no-inline-styles */
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />
        </View>

        {/* Payment method */}
        <View className="mb-4">
          <Text className="text-surface-300 text-sm mb-2">Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 pb-1">
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPayMethod(m)}
                  className={`px-4 py-2 rounded-xl border ${
                    payMethod === m
                      ? 'bg-yellow-500 border-yellow-500'
                      : 'bg-surface-100 border-surface-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      payMethod === m ? 'text-white' : 'text-surface-300'
                    }`}
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
          <Text className="text-surface-300 text-sm mb-2">Proof Screenshot (optional)</Text>
          {proofUri ? (
            <View className="relative">
              <Image
                source={{ uri: proofUri }}
                /* eslint-disable-next-line react-native/no-inline-styles */
                style={{ width: '100%', height: 160, borderRadius: 12 }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setProofUri(null)}
                className="absolute top-2 right-2 bg-red-500 rounded-full w-7 h-7 items-center justify-center"
              >
                <Text className="text-white text-xs font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickProof}
              className="border-2 border-dashed border-surface-300 rounded-2xl py-6 items-center"
            >
              <Text className="text-surface-300 text-2xl mb-1">📷</Text>
              <Text className="text-surface-300 text-sm">Attach screenshot</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Error */}
        {error && (
          <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          className={`rounded-2xl py-4 items-center ${
            logTransaction.isPending || uploading ? 'bg-surface-200' : 'bg-yellow-500'
          }`}
          onPress={handleSubmit}
          disabled={logTransaction.isPending || uploading}
        >
          {logTransaction.isPending || uploading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-bold">
                {uploading ? 'Uploading…' : 'Saving…'}
              </Text>
            </View>
          ) : (
            <Text className="text-white font-bold text-base">
              ✓ Log Deal — PKR {profit > 0 ? profit.toLocaleString() : '0'} Profit
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
