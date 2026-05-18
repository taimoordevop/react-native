import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { profileService } from '@/features/profile/services/profileService';

export default function PubgSetupScreen() {
  const [pubgId, setPubgId] = useState('');
  const [pubgNickname, setPubgNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setUser, setOnboardingCompleted } = useAuthStore();

  const validate = (): string | null => {
    if (!pubgId.trim()) return 'PUBG ID is required';
    if (pubgId.trim().length < 3) return 'PUBG ID must be at least 3 characters';
    if (!pubgNickname.trim()) return 'PUBG Nickname is required';
    if (pubgNickname.trim().length < 2) return 'Nickname must be at least 2 characters';
    return null;
  };

  const handleFinish = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      // Persist PUBG details and mark onboarding as complete in Firestore
      await profileService.update(user.uid, {
        pubgId: pubgId.trim(),
        pubgNickname: pubgNickname.trim(),
        onboardingCompleted: true,
      });
      // Update local Zustand store
      setUser({ ...user, pubgId: pubgId.trim(), pubgNickname: pubgNickname.trim() });
      setOnboardingCompleted();
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">

          {/* Back button */}
          <TouchableOpacity
            className="mb-6 mt-2 self-start"
            onPress={() => router.back()}
          >
            <Text className="text-primary-400 text-sm">← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-white text-3xl font-bold mb-2">Set up PUBG profile</Text>
            <Text className="text-surface-300 text-base">
              Your PUBG ID and nickname help buyers and suppliers identify you in-game.
            </Text>
          </View>

          {/* Info card */}
          <View className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 mb-8">
            <Text className="text-primary-300 text-sm font-semibold mb-1">Where to find your PUBG ID?</Text>
            <Text className="text-primary-400/80 text-xs">
              Open PUBG Mobile → Tap your avatar → Your numeric ID is shown below your nickname.
            </Text>
          </View>

          {/* PUBG ID field */}
          <View className="mb-5">
            <Text className="text-surface-300 text-sm mb-2">
              PUBG ID <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={pubgId}
              onChangeText={(v) => {
                setPubgId(v);
                if (error) setError(null);
              }}
              placeholder="e.g. 5123456789"
              placeholderTextColor="#475569"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <Text className="text-surface-400 text-xs mt-1">Numeric ID from your PUBG profile</Text>
          </View>

          {/* PUBG Nickname field */}
          <View className="mb-6">
            <Text className="text-surface-300 text-sm mb-2">
              PUBG Nickname <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={pubgNickname}
              onChangeText={(v) => {
                setPubgNickname(v);
                if (error) setError(null);
              }}
              placeholder="e.g. ProSniper99"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            <Text className="text-surface-400 text-xs mt-1">Your in-game display name</Text>
          </View>

          {/* Error */}
          {error && (
            <View className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 mb-4">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          {/* Finish button */}
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${loading ? 'bg-surface-200' : 'bg-primary-500'}`}
            onPress={handleFinish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Finish Setup</Text>
            )}
          </TouchableOpacity>

          <Text className="text-surface-400 text-xs text-center mt-4">
            You can update these details later from your profile.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
