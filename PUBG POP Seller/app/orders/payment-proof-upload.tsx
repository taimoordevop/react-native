import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { orderService } from '@/features/orders/services/orderService';

type Mode = 'buyer_payment' | 'seller_payout' | 'seller_payment';

const MODE_CONFIG: Record<Mode, { title: string; subtitle: string; btnLabel: string; color: string }> = {
  buyer_payment: {
    title: 'Upload Payment Screenshot',
    subtitle: 'Screenshot(s) of your payment transfer. The seller will review and confirm receipt.',
    btnLabel: 'Submit Payment Proof',
    color: 'bg-primary-500',
  },
  seller_payout: {
    title: 'Upload Payout Screenshot',
    subtitle: 'Screenshot(s) of payout sent to supplier. This completes the order.',
    btnLabel: 'Submit Payout & Complete',
    color: 'bg-green-600',
  },
  seller_payment: {
    title: 'Upload Payment to Supplier',
    subtitle: 'Screenshot(s) of payment sent to the supplier. The supplier will confirm receipt.',
    btnLabel: 'Submit Payment Proof',
    color: 'bg-indigo-600',
  },
};

export default function PaymentProofUploadScreen() {
  const { orderId, mode } = useLocalSearchParams<{ orderId: string; mode: Mode }>();
  const { user } = useAuth();

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const [currentFile, setCurrentFile] = useState<{ index: number; total: number } | null>(null);

  const cfg = MODE_CONFIG[mode ?? 'buyer_payment'];

  const overallProgress =
    currentFile && images.length > 0
      ? Math.round(
          ((currentFile.index + (progressMap[currentFile.index] ?? 0) / 100) /
            currentFile.total) *
            100,
        )
      : 0;

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access to upload screenshots.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!orderId || !user) return;
    if (images.length === 0) {
      Alert.alert('No screenshots', 'Please select at least one screenshot.');
      return;
    }
    try {
      setUploading(true);
      setProgressMap({});
      const uploadedUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        setCurrentFile({ index: i, total: images.length });
        const url = await orderService.uploadProofImage(
          orderId,
          user.uid,
          images[i],
          (pct) => setProgressMap((prev) => ({ ...prev, [i]: pct })),
        );
        uploadedUrls.push(url);
      }

      setCurrentFile(null);

      if (mode === 'buyer_payment') {
        await orderService.submitBuyerPaymentProof(orderId, uploadedUrls);
        Alert.alert(
          'Proof Submitted ✓',
          'Your payment screenshots have been submitted. The seller will confirm receipt shortly.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } else if (mode === 'seller_payment') {
        await orderService.submitSellerPaymentProof(orderId, uploadedUrls);
        Alert.alert(
          'Proof Submitted ✓',
          'Your payment screenshots have been submitted to the supplier. They will confirm receipt shortly.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } else {
        await orderService.submitSellerPayoutProof(orderId, uploadedUrls);
        Alert.alert(
          'Order Completed ✓',
          'Payout proof uploaded. The order is now marked as completed.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    } catch (err) {
      setCurrentFile(null);
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3" disabled={uploading}>
          <Text className="text-primary-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">{cfg.title}</Text>
      </View>

      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Instructions */}
        <View className="bg-primary-500/10 border border-primary-500/30 rounded-2xl p-4 mb-6">
          <Text className="text-primary-400 font-semibold mb-1">Instructions</Text>
          <Text className="text-surface-300 text-sm leading-5">{cfg.subtitle}</Text>
          <Text className="text-surface-400 text-xs mt-2">Up to 5 screenshots allowed.</Text>
        </View>

        {/* Image previews */}
        {images.length > 0 && (
          <View className="mb-4">
            <Text className="text-surface-300 text-sm mb-3">
              Selected ({images.length}/5)
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {images.map((uri, i) => (
                <View key={i} className="relative">
                  <Image
                    source={{ uri }}
                    /* eslint-disable-next-line react-native/no-inline-styles */
                    style={{ width: 100, height: 100, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                  {/* Per-image progress overlay */}
                  {uploading && progressMap[i] !== undefined && progressMap[i] < 100 && (
                    <View
                      className="absolute inset-0 bg-black/60 rounded-xl items-center justify-center"
                    >
                      <Text className="text-white text-xs font-bold">{progressMap[i]}%</Text>
                    </View>
                  )}
                  {uploading && progressMap[i] === 100 && (
                    <View className="absolute inset-0 bg-green-500/40 rounded-xl items-center justify-center">
                      <Text className="text-white text-lg">✓</Text>
                    </View>
                  )}
                  {!uploading && (
                    <TouchableOpacity
                      onPress={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                    >
                      <Text className="text-white text-xs font-bold">✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Overall upload progress bar */}
        {uploading && (
          <View className="mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-surface-300 text-xs">
                Uploading {(currentFile?.index ?? 0) + 1} of {currentFile?.total ?? images.length}…
              </Text>
              <Text className="text-surface-300 text-xs">{overallProgress}%</Text>
            </View>
            <View className="h-2 bg-surface-200 rounded-full overflow-hidden">
              <View
                className="h-2 bg-primary-500 rounded-full"
                /* eslint-disable-next-line react-native/no-inline-styles */
                style={{ width: `${overallProgress}%` }}
              />
            </View>
          </View>
        )}

        {/* Pick images button */}
        {images.length < 5 && !uploading && (
          <TouchableOpacity
            onPress={pickImages}
            className="border-2 border-dashed border-surface-300 rounded-2xl py-8 items-center mb-6"
          >
            <Text className="text-surface-300 text-3xl mb-2">📷</Text>
            <Text className="text-white font-semibold">
              {images.length === 0 ? 'Select Screenshots' : 'Add More'}
            </Text>
            <Text className="text-surface-400 text-xs mt-1">From your photo library</Text>
          </TouchableOpacity>
        )}

        {/* Submit button */}
        <TouchableOpacity
          className={`rounded-2xl py-4 items-center ${
            uploading || images.length === 0 ? 'bg-surface-200' : cfg.color
          }`}
          onPress={handleSubmit}
          disabled={uploading || images.length === 0}
        >
          {uploading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-bold">Uploading to Cloudinary…</Text>
            </View>
          ) : (
            <Text className="text-white font-bold text-base">{cfg.btnLabel}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
