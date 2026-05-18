import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { profileService } from '@/features/profile/services/profileService';
import type { UserRole } from '@/shared/types';

interface RoleCard {
  role: UserRole;
  title: string;
  description: string;
  perks: string[];
  /** NativeWind border color class when selected */
  borderColor: string;
  /** NativeWind icon background */
  iconBg: string;
  /** NativeWind icon text color */
  iconColor: string;
  emoji: string;
}

const ROLES: RoleCard[] = [
  {
    role: 'buyer',
    title: 'Buyer',
    description: 'Browse and purchase PUBG items, UC, and services from trusted suppliers.',
    perks: ['Browse marketplace listings', 'Place and track orders', 'Leave reviews'],
    borderColor: 'border-blue-500',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    emoji: '🛒',
  },
  {
    role: 'supplier',
    title: 'Supplier',
    description: 'Sell PUBG items, UC top-ups, and services. Build your reputation.',
    perks: ['Create listings', 'Receive orders', 'Upload proof of delivery', 'Earn reputation'],
    borderColor: 'border-green-500',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
    emoji: '🏪',
  },
  {
    role: 'admin',
    title: 'Admin',
    description: 'Manage the platform, resolve disputes, and oversee all transactions.',
    perks: ['View all users', 'Manage disputes', 'Platform oversight'],
    borderColor: 'border-purple-500',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    emoji: '🛡️',
  },
];

export default function RoleSelectScreen() {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setUser } = useAuthStore();

  const handleContinue = async () => {
    if (!selected || !user) return;
    try {
      setLoading(true);
      setError(null);
      // Persist selected role to Firestore
      await profileService.update(user.uid, { role: selected });
      // Update local store immediately
      setUser({ ...user, role: selected });
      router.replace('/(auth)/onboarding/pubg-setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        {/* Header */}
        <View className="mb-8 mt-4">
          <Text className="text-white text-3xl font-bold mb-2">Choose your role</Text>
          <Text className="text-surface-300 text-base">
            Select how you&apos;ll use POP Seller. You can contact support to change this later.
          </Text>
        </View>

        {/* Role Cards */}
        {ROLES.map((card) => {
          const isSelected = selected === card.role;
          return (
            <TouchableOpacity
              key={card.role}
              onPress={() => setSelected(card.role)}
              className={`bg-surface-100 rounded-2xl p-5 mb-4 border-2 ${
                isSelected ? card.borderColor : 'border-surface-200'
              }`}
              activeOpacity={0.85}
            >
              {/* Role header */}
              <View className="flex-row items-center gap-3 mb-3">
                <View className={`w-12 h-12 rounded-xl ${card.iconBg} items-center justify-center`}>
                  <Text className="text-2xl">{card.emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">{card.title}</Text>
                  {isSelected && (
                    <Text className={`text-xs font-semibold ${card.iconColor}`}>Selected ✓</Text>
                  )}
                </View>
              </View>

              <Text className="text-surface-300 text-sm mb-3">{card.description}</Text>

              {/* Perks list */}
              <View className="gap-1">
                {card.perks.map((perk) => (
                  <View key={perk} className="flex-row items-center gap-2">
                    <Text className={`text-xs ${card.iconColor}`}>•</Text>
                    <Text className="text-surface-300 text-xs">{perk}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Error */}
        {error && (
          <View className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          className={`rounded-xl py-4 items-center mt-2 ${
            selected && !loading ? 'bg-primary-500' : 'bg-surface-200'
          }`}
          onPress={handleContinue}
          disabled={!selected || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`font-semibold text-base ${selected ? 'text-white' : 'text-surface-300'}`}>
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
