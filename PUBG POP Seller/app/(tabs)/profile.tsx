import * as Clipboard from 'expo-clipboard';
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
import type { PaymentMethod, PaymentMethodType, UserRole } from '@/shared/types';

const PAYMENT_TYPES: PaymentMethodType[] = ['JazzCash', 'EasyPaisa', 'Bank Transfer', 'SadaPay', 'NayaPay'];

const METHOD_ICONS: Record<PaymentMethodType, string> = {
  JazzCash: '💳',
  EasyPaisa: '📱',
  'Bank Transfer': '🏦',
  SadaPay: '💜',
  NayaPay: '🟢',
};

/** Role badge config — PUBG dark theme colors */
const ROLE_BADGE: Record<UserRole, { label: string; bg: string; text: string }> = {
  buyer:    { label: 'Buyer',    bg: 'bg-blue-500/20',   text: 'text-blue-400' },
  supplier: { label: 'Supplier', bg: 'bg-green-500/20',  text: 'text-green-400' },
  seller:   { label: 'Seller',   bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  admin:    { label: 'Admin',    bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

/** Get current methods array from paymentDetails — merges legacy flat fields + new methods array */
function getMethods(details: import('@/shared/types').SellerPaymentDetails | null | undefined): PaymentMethod[] {
  if (!details) return [];
  const out: PaymentMethod[] = [...(details.methods ?? [])];
  // Migrate legacy flat fields if no methods array yet
  if (!details.methods) {
    if (details.jazzCash) out.push({ type: 'JazzCash', accountNumber: details.jazzCash });
    if (details.easyPaisa) out.push({ type: 'EasyPaisa', accountNumber: details.easyPaisa });
    if (details.bankAccount) out.push({ type: 'Bank Transfer', accountNumber: details.bankAccount, accountTitle: details.bankName });
  }
  return out;
}

export default function ProfileScreen() {
  const { user, setUser, signOut } = useAuthStore();

  // Edit PUBG modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPubgId, setEditPubgId] = useState(user?.pubgId ?? '');
  const [editNickname, setEditNickname] = useState(user?.pubgNickname ?? '');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Payment method modal state
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  // Which method we're adding/editing (null = closed)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // Form fields for the method being added/edited
  const [selectedType, setSelectedType] = useState<PaymentMethodType>('JazzCash');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  // Show type picker dropdown
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const role = user?.role ?? 'buyer';
  const badge = ROLE_BADGE[role];
  const savedMethods = getMethods(user?.paymentDetails);

  const handleSignOut = async () => {
    await authService.signOut();
    signOut();
  };

  const openEditModal = () => {
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
      setUser({ ...user, pubgId: editPubgId.trim(), pubgNickname: editNickname.trim() });
      setEditModalVisible(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  /** Open modal to add a new payment method */
  const openAddMethod = () => {
    setEditingIndex(null);
    setSelectedType('JazzCash');
    setAccountNumber('');
    setAccountTitle('');
    setPayError(null);
    setTypePickerOpen(false);
    setPayModalVisible(true);
  };

  /** Open modal to edit an existing payment method */
  const openEditMethod = (index: number) => {
    const m = savedMethods[index];
    setEditingIndex(index);
    setSelectedType(m.type);
    setAccountNumber(m.accountNumber);
    setAccountTitle(m.accountTitle ?? '');
    setPayError(null);
    setTypePickerOpen(false);
    setPayModalVisible(true);
  };

  const handleDeleteMethod = (index: number) => {
    Alert.alert('Remove Payment Method', 'Are you sure you want to remove this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          const updated = savedMethods.filter((_, i) => i !== index);
          const details = { methods: updated };
          await profileService.update(user.uid, { paymentDetails: details });
          setUser({ ...user, paymentDetails: details });
        },
      },
    ]);
  };

  const handleSaveMethod = async () => {
    if (!user) return;
    if (!accountNumber.trim()) {
      setPayError('Account number is required.');
      return;
    }
    if (accountNumber.trim().length < 5) {
      setPayError('Enter a valid account number (min 5 characters).');
      return;
    }
    try {
      setPayLoading(true);
      setPayError(null);
      const newMethod: PaymentMethod = {
        type: selectedType,
        accountNumber: accountNumber.trim(),
        ...(accountTitle.trim() ? { accountTitle: accountTitle.trim() } : {}),
      };
      let updated: PaymentMethod[];
      if (editingIndex !== null) {
        updated = savedMethods.map((m, i) => (i === editingIndex ? newMethod : m));
      } else {
        updated = [...savedMethods, newMethod];
      }
      const details = { methods: updated };
      await profileService.update(user.uid, { paymentDetails: details });
      setUser({ ...user, paymentDetails: details });
      setPayModalVisible(false);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setPayLoading(false);
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

        {/* ── Payment Details (seller/supplier only) ── */}
        {(role === 'seller' || role === 'supplier') && (
          <View className="bg-surface-100 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold">Payment Methods</Text>
              <TouchableOpacity onPress={openAddMethod}>
                <Text className="text-primary-400 text-sm">+ Add</Text>
              </TouchableOpacity>
            </View>

            {savedMethods.length === 0 ? (
              <Text className="text-surface-400 text-sm">
                No payment methods yet. Tap + Add to add JazzCash, EasyPaisa, Bank, etc.
              </Text>
            ) : (
              savedMethods.map((m, i) => (
                <View
                  key={i}
                  className={`flex-row items-center py-3 ${
                    i < savedMethods.length - 1 ? 'border-b border-surface-200' : ''
                  }`}
                >
                  {/* Icon + details */}
                  <Text className="text-xl mr-3">{METHOD_ICONS[m.type]}</Text>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-sm">{m.type}</Text>
                    {m.accountTitle ? (
                      <Text className="text-surface-400 text-xs">{m.accountTitle}</Text>
                    ) : null}
                    <Text className="text-surface-300 text-sm">{m.accountNumber}</Text>
                  </View>
                  {/* Copy */}
                  <TouchableOpacity
                    onPress={() => Clipboard.setStringAsync(m.accountNumber)}
                    className="bg-surface-200 rounded-lg px-2 py-1 mr-2"
                  >
                    <Text className="text-surface-300 text-xs">📋</Text>
                  </TouchableOpacity>
                  {/* Edit */}
                  <TouchableOpacity
                    onPress={() => openEditMethod(i)}
                    className="bg-primary-500/20 rounded-lg px-2 py-1 mr-2"
                  >
                    <Text className="text-primary-400 text-xs">Edit</Text>
                  </TouchableOpacity>
                  {/* Delete */}
                  <TouchableOpacity
                    onPress={() => handleDeleteMethod(i)}
                    className="bg-red-500/20 rounded-lg px-2 py-1"
                  >
                    <Text className="text-red-400 text-xs">✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

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

      {/* ── Add / Edit Payment Method Modal ── */}
      <Modal
        visible={payModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPayModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <ScrollView
            /* eslint-disable-next-line react-native/no-inline-styles */
            style={{ maxHeight: '85%' }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="bg-surface rounded-t-3xl p-6">
              <Text className="text-white text-xl font-bold mb-1">
                {editingIndex !== null ? 'Update Payment Method' : 'Add Payment Method'}
              </Text>
              <Text className="text-surface-300 text-sm mb-5">
                {editingIndex !== null
                  ? 'Edit your account details below.'
                  : 'Choose a payment type and enter your account number.'}
              </Text>

              {/* ── Payment Type Dropdown ── */}
              <Text className="text-surface-300 text-sm mb-2">Payment Type *</Text>
              <TouchableOpacity
                className="bg-surface-100 rounded-xl px-4 py-3 mb-1 flex-row justify-between items-center"
                onPress={() => setTypePickerOpen((o) => !o)}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">{METHOD_ICONS[selectedType]}</Text>
                  <Text className="text-white text-base">{selectedType}</Text>
                </View>
                <Text className="text-surface-300">{typePickerOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {typePickerOpen && (
                <View className="bg-surface-200 rounded-xl mb-4 overflow-hidden">
                  {PAYMENT_TYPES.map((pt) => (
                    <TouchableOpacity
                      key={pt}
                      className={`px-4 py-3 flex-row items-center gap-3 ${
                        pt === selectedType ? 'bg-primary-500/20' : ''
                      }`}
                      onPress={() => {
                        setSelectedType(pt);
                        setTypePickerOpen(false);
                      }}
                    >
                      <Text className="text-xl">{METHOD_ICONS[pt]}</Text>
                      <Text className={`text-base ${
                        pt === selectedType ? 'text-primary-400 font-semibold' : 'text-white'
                      }`}>{pt}</Text>
                      {pt === selectedType && <Text className="text-primary-400 ml-auto">✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* ── Account Number ── */}
              <View className="mb-4 mt-2">
                <Text className="text-surface-300 text-sm mb-2">Account Number *</Text>
                <TextInput
                  className="bg-surface-100 text-white rounded-xl px-4 py-3 text-base"
                  value={accountNumber}
                  onChangeText={(v) => { setAccountNumber(v); setPayError(null); }}
                  placeholder={
                    selectedType === 'Bank Transfer'
                      ? 'IBAN or account number'
                      : '03XX-XXXXXXX'
                  }
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                />
              </View>

              {/* ── Account Title (optional) ── */}
              <View className="mb-5">
                <Text className="text-surface-300 text-sm mb-2">
                  {selectedType === 'Bank Transfer' ? 'Account Title / Bank Name' : 'Account Name (optional)'}
                </Text>
                <TextInput
                  className="bg-surface-100 text-white rounded-xl px-4 py-3 text-base"
                  value={accountTitle}
                  onChangeText={setAccountTitle}
                  placeholder={
                    selectedType === 'Bank Transfer'
                      ? 'e.g. Muhammad Ali — HBL'
                      : 'e.g. Muhammad Ali'
                  }
                  placeholderTextColor="#475569"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {payError && (
                <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4">
                  <Text className="text-red-400 text-sm">{payError}</Text>
                </View>
              )}

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-surface-200 rounded-xl py-4 items-center"
                  onPress={() => setPayModalVisible(false)}
                  disabled={payLoading}
                >
                  <Text className="text-white font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 rounded-xl py-4 items-center ${
                    payLoading ? 'bg-surface-200' : 'bg-primary-500'
                  }`}
                  onPress={handleSaveMethod}
                  disabled={payLoading}
                >
                  {payLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold">
                      {editingIndex !== null ? 'Update' : 'Save Method'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

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
