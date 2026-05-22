import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { profileService } from '@/features/profile/services/profileService';
import type { UserRole } from '@/shared/types';

/** Role badge config — PUBG dark theme colors */
const ROLE_BADGE: Record<UserRole, { label: string; bg: string; text: string }> = {
  buyer:    { label: 'Buyer',    bg: 'bg-blue-500/20',   text: 'text-blue-400' },
  supplier: { label: 'Supplier', bg: 'bg-green-500/20',  text: 'text-green-400' },
  seller:   { label: 'Seller',   bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  admin:    { label: 'Admin',    bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

export default function ProfileScreen() {
  const { user, setUser, signOut } = useAuthStore();

  // Edit PUBG modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPubgId, setEditPubgId] = useState(user?.pubgId ?? '');
  const [editNickname, setEditNickname] = useState(user?.pubgNickname ?? '');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const role = user?.role ?? 'buyer';
  const badge = ROLE_BADGE[role];

  const handleSignOut = async () => {
    await authService.signOut();
    signOut();
  };

  const openEditModal = () => {
    // Reset fields to current values when opening
    setEditPubgId(user?.pubgId ?? '');
    setEditNickname(user?.pubgNickname ?? '');
    setEditError(null);
    setEditModalVisible(true);
  };

  const handleSavePubgInfo = async () => {
    if (!editPubgId.trim() || editPubgId.trim().length < 3) {
      setEditError('PUBG ID must be at least 3 characters');
      return;
    }
    if (!editNickname.trim() || editNickname.trim().length < 2) {
      setEditError('Nickname must be at least 2 characters');
      return;
    }
    if (!user) return;

    try {
      setEditLoading(true);
      setEditError(null);
      await profileService.update(user.uid, {
        pubgId: editPubgId.trim(),
        pubgNickname: editNickname.trim(),
      });
      // Update local store immediately
      setUser({ ...user, pubgId: editPubgId.trim(), pubgNickname: editNickname.trim() });
      setEditModalVisible(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleGoToOnboarding = () => {
    Alert.alert(
      'Redo Onboarding',
      'Go back to role selection and PUBG setup?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => router.push('/(auth)/onboarding/role-select') },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-white text-2xl font-bold mb-6">Profile</Text>

        {/* ── Avatar + Identity Card ── */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-16 h-16 rounded-full bg-primary-500/30 items-center justify-center">
              <Text className="text-primary-400 text-2xl font-bold">
                {user?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">{user?.displayName ?? 'Seller'}</Text>
              <Text className="text-surface-300 text-sm mb-1">{user?.email ?? ''}</Text>
              {/* Role badge */}
              <View className={`self-start px-3 py-1 rounded-full ${badge.bg}`}>
                <Text className={`text-xs font-semibold ${badge.text}`}>{badge.label}</Text>
              </View>
            </View>
            {/* Verified indicator */}
            {user?.isVerified && (
              <View className="bg-green-500/20 rounded-full px-2 py-1">
                <Text className="text-green-400 text-xs">✓ Verified</Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View className="flex-row gap-3">
            {[
              { label: 'Reputation', value: String(user?.reputation ?? 0) },
              { label: 'POP Sent', value: String(user?.totalPopSent ?? 0) },
              { label: 'POP Received', value: String(user?.totalPopReceived ?? 0) },
            ].map(({ label, value }) => (
              <View key={label} className="flex-1 items-center bg-surface-200 rounded-xl p-3">
                <Text className="text-white font-bold text-lg">{value}</Text>
                <Text className="text-surface-300 text-xs text-center">{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── PUBG Details Card ── */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-semibold">PUBG Details</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text className="text-primary-400 text-sm">Edit</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between py-2 border-b border-surface-200">
            <Text className="text-surface-300 text-sm">PUBG ID</Text>
            <Text className="text-white text-sm">{user?.pubgId ?? 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-surface-200">
            <Text className="text-surface-300 text-sm">Nickname</Text>
            <Text className="text-white text-sm">{user?.pubgNickname ?? 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-surface-300 text-sm">Server</Text>
            <Text className="text-white text-sm">{user?.pubgServer ?? 'Not set'}</Text>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View className="bg-surface-100 rounded-2xl overflow-hidden mb-4">
          {[
            { label: 'My Listings', action: () => {} },
            { label: 'Earnings', action: () => {} },
            { label: 'Settings', action: () => {} },
            { label: 'Redo Onboarding', action: handleGoToOnboarding },
          ].map(({ label, action }, i, arr) => (
            <TouchableOpacity
              key={label}
              onPress={action}
              className={`px-4 py-4 flex-row justify-between items-center ${
                i < arr.length - 1 ? 'border-b border-surface-200' : ''
              }`}
            >
              <Text className="text-white">{label}</Text>
              <Text className="text-surface-300">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity
          className="bg-red-500/20 border border-red-500/30 rounded-2xl py-4 items-center"
          onPress={handleSignOut}
        >
          <Text className="text-red-400 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Edit PUBG Info Modal ── */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-3xl p-6">
            <Text className="text-white text-xl font-bold mb-1">Edit PUBG Info</Text>
            <Text className="text-surface-300 text-sm mb-6">
              Update your PUBG ID and in-game nickname.
            </Text>

            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-2">PUBG ID</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                value={editPubgId}
                onChangeText={(v) => { setEditPubgId(v); setEditError(null); }}
                placeholder="e.g. 5123456789"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>

            <View className="mb-5">
              <Text className="text-surface-300 text-sm mb-2">PUBG Nickname</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                value={editNickname}
                onChangeText={(v) => { setEditNickname(v); setEditError(null); }}
                placeholder="e.g. ProSniper99"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>

            {editError && (
              <View className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm">{editError}</Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-surface-200 rounded-xl py-4 items-center"
                onPress={() => setEditModalVisible(false)}
                disabled={editLoading}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-4 items-center ${editLoading ? 'bg-surface-200' : 'bg-primary-500'}`}
                onPress={handleSavePubgInfo}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
