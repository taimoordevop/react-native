import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useCreateListing } from '@/features/marketplace/hooks/useListings';
import { POP_PRESETS, RATE_HINT, MIN_ORDER_POP } from '@/constants';

export default function CreateListingScreen() {
  const { user } = useAuth();
  const createListing = useCreateListing();

  // Form state
  const [popAmount, setPopAmount] = useState('');
  const [ratePer10k, setRatePer10k] = useState('');
  const [minAmount, setMinAmount] = useState(String(MIN_ORDER_POP));
  const [totalAvailable, setTotalAvailable] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Only suppliers can create listings
  if (!user || user.role !== 'supplier') {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-white text-xl font-bold mb-2 text-center">
          Suppliers Only
        </Text>
        <Text className="text-surface-300 text-sm text-center mb-6">
          Only users with the Supplier role can create listings. Update your role in Profile.
        </Text>
        <TouchableOpacity
          className="bg-primary-500 rounded-xl px-6 py-3"
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text className="text-white font-semibold">Go to Profile</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /** Calculates total PKR based on current inputs */
  const calcPreview = (): string | null => {
    const pop = parseInt(popAmount, 10);
    const rate = parseInt(ratePer10k, 10);
    if (!pop || !rate || isNaN(pop) || isNaN(rate)) return null;
    const total = Math.round((pop / 10_000) * rate);
    return `PKR ${total.toLocaleString()}`;
  };

  const validate = (): string | null => {
    const pop = parseInt(popAmount, 10);
    const rate = parseInt(ratePer10k, 10);
    const min = parseInt(minAmount, 10);
    if (!pop || isNaN(pop) || pop < 1000) return 'POP amount must be at least 1,000';
    if (!rate || isNaN(rate) || rate < 1) return 'Rate per 10k must be a positive number';
    if (!min || isNaN(min) || min < MIN_ORDER_POP)
      return `Minimum order must be at least ${MIN_ORDER_POP.toLocaleString()} POP`;
    if (min > pop) return 'Minimum order cannot exceed total POP amount';
    if (totalAvailable) {
      const avail = parseInt(totalAvailable, 10);
      if (isNaN(avail) || avail < pop)
        return 'Total available must be ≥ POP amount in this listing';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const totalAvailableNum = totalAvailable ? parseInt(totalAvailable, 10) : null;

    createListing.mutate(
      {
        supplierId: user.uid,
        supplierName: user.displayName,
        supplierPubgNickname: user.pubgNickname,
        popAmount: parseInt(popAmount, 10),
        ratePer10k: parseInt(ratePer10k, 10),
        minAmount: parseInt(minAmount, 10),
        totalAvailable: totalAvailableNum,
        expiresAt: null,
      },
      {
        onSuccess: () => {
          Alert.alert('Listing Created!', 'Your listing is now live on the marketplace.', [
            { text: 'View Marketplace', onPress: () => router.replace('/(tabs)/marketplace') },
            { text: 'Create Another', onPress: () => resetForm() },
          ]);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Failed to create listing.');
        },
      },
    );
  };

  const resetForm = () => {
    setPopAmount('');
    setRatePer10k('');
    setMinAmount(String(MIN_ORDER_POP));
    setTotalAvailable('');
    setError(null);
  };

  const pricePreview = calcPreview();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-primary-400">← Back</Text>
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Create Listing</Text>
          </View>

          {/* Rate hint banner */}
          <View className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-3 mb-6">
            <Text className="text-primary-300 text-xs">
              💡 Typical market rate: PKR {RATE_HINT.min}–{RATE_HINT.max} per 10,000 POP
            </Text>
          </View>

          {/* ── POP Amount ── */}
          <View className="mb-5">
            <Text className="text-surface-300 text-sm mb-2">
              POP Amount <Text className="text-red-400">*</Text>
            </Text>
            {/* Presets */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
              <View className="flex-row gap-2">
                {POP_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    className={`px-3 py-2 rounded-lg border ${
                      popAmount === String(preset)
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-surface-200 border-surface-200'
                    }`}
                    onPress={() => setPopAmount(String(preset))}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        popAmount === String(preset) ? 'text-white' : 'text-surface-300'
                      }`}
                    >
                      {(preset / 1000).toFixed(0)}k
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={popAmount}
              onChangeText={(v) => { setPopAmount(v.replace(/[^0-9]/g, '')); setError(null); }}
              placeholder="e.g. 50000"
              placeholderTextColor="#475569"
              keyboardType="numeric"
            />
            <Text className="text-surface-400 text-xs mt-1">
              Minimum 1,000 POP
            </Text>
          </View>

          {/* ── Rate per 10k ── */}
          <View className="mb-5">
            <Text className="text-surface-300 text-sm mb-2">
              Rate (PKR per 10,000 POP) <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={ratePer10k}
              onChangeText={(v) => { setRatePer10k(v.replace(/[^0-9]/g, '')); setError(null); }}
              placeholder={`e.g. ${RATE_HINT.min}–${RATE_HINT.max}`}
              placeholderTextColor="#475569"
              keyboardType="numeric"
            />
            {/* Live price preview */}
            {pricePreview && (
              <View className="mt-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                <Text className="text-green-400 text-xs">
                  Total listing value: {pricePreview}
                </Text>
              </View>
            )}
          </View>

          {/* ── Minimum Order ── */}
          <View className="mb-5">
            <Text className="text-surface-300 text-sm mb-2">
              Minimum Order (POP) <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={minAmount}
              onChangeText={(v) => { setMinAmount(v.replace(/[^0-9]/g, '')); setError(null); }}
              placeholder={String(MIN_ORDER_POP)}
              placeholderTextColor="#475569"
              keyboardType="numeric"
            />
            <Text className="text-surface-400 text-xs mt-1">
              Minimum {MIN_ORDER_POP.toLocaleString()} POP per order
            </Text>
          </View>

          {/* ── Total Available (optional) ── */}
          <View className="mb-6">
            <Text className="text-surface-300 text-sm mb-2">
              Total Available (POP) <Text className="text-surface-400">— optional</Text>
            </Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={totalAvailable}
              onChangeText={(v) => { setTotalAvailable(v.replace(/[^0-9]/g, '')); setError(null); }}
              placeholder="Leave blank for unlimited"
              placeholderTextColor="#475569"
              keyboardType="numeric"
            />
          </View>

          {/* Error */}
          {error && (
            <View className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 mb-4">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${
              createListing.isPending ? 'bg-surface-200' : 'bg-primary-500'
            }`}
            onPress={handleSubmit}
            disabled={createListing.isPending}
          >
            {createListing.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Publish Listing</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
