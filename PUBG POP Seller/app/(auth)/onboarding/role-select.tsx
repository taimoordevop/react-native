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
  borderColor: string;
  iconBg: string;
  iconColor: string;
  emoji: string;
}

const ROLES: RoleCard[] = [
  {
    role: 'buyer',
    title: 'Buyer',
    description: 'Browse and purchase POP from sellers. Track your orders and manage your PUBG account top-ups.',
    perks: ['Browse seller POP requests', 'Place & track orders', 'Leave reviews'],
    borderColor: '#3b82f6',
    iconBg: 'rgba(59, 130, 246, 0.12)',
    iconColor: 'text-blue-400',
    emoji: '🛒',
  },
  {
    role: 'supplier',
    title: 'Supplier',
    description: 'You have POP in your PUBG account. Book seller requests, send POP, and earn money.',
    perks: ['Browse open POP requests', 'Book amounts you can supply', 'Submit proof & get paid'],
    borderColor: '#22c55e',
    iconBg: 'rgba(34, 197, 94, 0.12)',
    iconColor: 'text-green-400',
    emoji: '🏪',
  },
  {
    role: 'seller',
    title: 'Seller (Middleman)',
    description: 'Post POP requests, manage supplier bookings, handle escrow and buyer orders.',
    perks: ['Post POP requests', 'Accept/reject supplier bookings', 'Escrow & commission management', 'Full order oversight'],
    borderColor: '#eab308',
    iconBg: 'rgba(234, 179, 8, 0.12)',
    iconColor: 'text-yellow-400',
    emoji: '⚡',
  },
];

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
      await profileService.update(user.uid, { role: selected });
      setUser({ ...user, role: selected });
      router.replace('/(auth)/onboarding/pubg-setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      <TacticalGrid />
      <CornerReticles />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        {/* Header */}
        <View className="mb-8 mt-4">
          <Text className="text-white text-2xl font-bold uppercase mb-2">Choose your role</Text>
          <Text className="text-surface-300 text-sm leading-relaxed">
            Select how you&apos;ll use PUBG MART. You can contact support to change this later.
          </Text>
        </View>

        {/* Role Cards */}
        {ROLES.map((card) => {
          const isSelected = selected === card.role;
          return (
            <TouchableOpacity
              key={card.role}
              onPress={() => setSelected(card.role)}
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.35)',
                borderWidth: 1.5,
                borderColor: isSelected ? '#D4A017' : 'rgba(255,255,255,0.08)',
                borderRadius: 4,
              }}
              className="p-5 mb-4"
              activeOpacity={0.85}
            >
              {/* Role header */}
              <View className="flex-row items-center gap-3 mb-3">
                <View style={{ backgroundColor: card.iconBg, borderRadius: 2 }} className="w-12 h-12 items-center justify-center border border-white/5">
                  <Text className="text-xl">{card.emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-bold uppercase">{card.title}</Text>
                  {isSelected && (
                    <Text className="text-[#D4A017] text-[10px] font-bold uppercase mt-0.5">Selected ✓</Text>
                  )}
                </View>
              </View>

              <Text className="text-surface-300 text-xs mb-4 leading-relaxed">{card.description}</Text>

              {/* Perks list */}
              <View className="gap-1.5">
                {card.perks.map((perk) => (
                  <View key={perk} className="flex-row items-center gap-2">
                    <Text className="text-[#D4A017] text-xs">•</Text>
                    <Text className="text-surface-300 text-xs">{perk}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Error */}
        {error && (
          <View className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3 mb-4">
            <Text className="text-red-400 text-xs">{error}</Text>
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={{
            borderWidth: 1.5,
            borderColor: selected && !loading ? '#D4A017' : 'rgba(255,255,255,0.08)',
            backgroundColor: selected && !loading ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.03)',
            borderRadius: 2,
            paddingVertical: 15,
            alignItems: 'center',
            marginTop: 8,
          }}
          onPress={handleContinue}
          disabled={!selected || loading}
        >
          {loading ? (
            <ActivityIndicator color="#D4A017" />
          ) : (
            <Text
              style={{
                color: selected ? '#D4A017' : 'rgba(255,255,255,0.3)',
                fontWeight: 'bold',
                fontSize: 13,
                letterSpacing: 1,
              }}
              className="uppercase"
            >
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
