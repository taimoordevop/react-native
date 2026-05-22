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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useSubmitProof } from '@/features/orders/hooks/useOrders';

export default function ProofUploadScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const submitProof = useSubmitProof();

  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const validate = () => {
    if (!url.trim()) {
      setUrlError('Please enter a video URL or link');
      return false;
    }
    if (!url.startsWith('http')) {
      setUrlError('URL must start with http:// or https://');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate() || !user || !orderId) return;

    submitProof.mutate(
      {
        orderId,
        supplierId: user.uid,
        url: url.trim(),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Proof Submitted',
            'Your proof has been submitted. The buyer will verify and release payment.',
            [{ text: 'OK', onPress: () => router.back() }],
          );
        },
        onError: (err) => {
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit proof');
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Upload Proof</Text>
      </View>

      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Instructions */}
        <View className="bg-primary-500/10 border border-primary-500/30 rounded-2xl p-4 mb-6">
          <Text className="text-primary-400 font-semibold mb-2">How to submit proof</Text>
          <Text className="text-surface-300 text-sm leading-5">
            1. Record a screen video showing you sending POP in PUBG Mobile.{'\n'}
            2. Upload the video to Google Drive, YouTube (unlisted), or any cloud link.{'\n'}
            3. Paste the shareable link below.{'\n'}
            4. Add optional notes (e.g. "Sent in 3 batches").
          </Text>
        </View>

        {/* Video URL input */}
        <View className="mb-4">
          <Text className="text-surface-300 text-sm mb-2">Video / Proof Link *</Text>
          <TextInput
            className="bg-surface-100 text-white rounded-xl px-4 py-4 text-sm"
            value={url}
            onChangeText={(v) => { setUrl(v); setUrlError(null); }}
            placeholder="https://drive.google.com/... or https://youtu.be/..."
            placeholderTextColor="#475569"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {urlError && (
            <Text className="text-red-400 text-xs mt-1">{urlError}</Text>
          )}
        </View>

        {/* Notes input */}
        <View className="mb-6">
          <Text className="text-surface-300 text-sm mb-2">Notes (optional)</Text>
          <TextInput
            className="bg-surface-100 text-white rounded-xl px-4 py-3 text-sm"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Sent in 2 separate batches of 25k each"
            placeholderTextColor="#475569"
            multiline
            numberOfLines={3}
            // eslint-disable-next-line react-native/no-inline-styles
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          className={`rounded-2xl py-4 items-center ${
            submitProof.isPending ? 'bg-surface-200' : 'bg-purple-600'
          }`}
          onPress={handleSubmit}
          disabled={submitProof.isPending}
        >
          {submitProof.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Submit Proof</Text>
          )}
        </TouchableOpacity>

        {submitProof.isError && (
          <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mt-4">
            <Text className="text-red-400 text-sm">
              {submitProof.error instanceof Error
                ? submitProof.error.message
                : 'Submission failed. Please try again.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
