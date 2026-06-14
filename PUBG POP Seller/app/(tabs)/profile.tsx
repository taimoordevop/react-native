import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
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

/** Role badge config — Gold theme matching roles */
const ROLE_BADGE: Record<UserRole, { label: string; bg: string; text: string }> = {
  buyer:    { label: 'Buyer',    bg: 'rgba(59, 130, 246, 0.12)',   text: 'text-blue-400' },
  supplier: { label: 'Supplier', bg: 'rgba(34, 197, 94, 0.12)',  text: 'text-green-400' },
  seller:   { label: 'Seller',   bg: 'rgba(234, 179, 8, 0.12)', text: 'text-yellow-400' },
  admin:    { label: 'Admin',    bg: 'rgba(168, 85, 247, 0.12)', text: 'text-purple-400' },
};

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

function getMethods(details: import('@/shared/types').SellerPaymentDetails | null | undefined): PaymentMethod[] {
  if (!details) return [];
  const out: PaymentMethod[] = [...(details.methods ?? [])];
  if (!details.methods) {
    if (details.jazzCash) out.push({ type: 'JazzCash', accountNumber: details.jazzCash });
    if (details.easyPaisa) out.push({ type: 'EasyPaisa', accountNumber: details.easyPaisa });
    if (details.bankAccount) out.push({ type: 'Bank Transfer', accountNumber: details.bankAccount, accountTitle: details.bankName });
  }
  return out;
}

export default function ProfileScreen() {
  const { user, setUser, signOut } = useAuthStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPubgId, setEditPubgId] = useState(user?.pubgId ?? '');
  const [editNickname, setEditNickname] = useState(user?.pubgNickname ?? '');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [editWhatsapp, setEditWhatsapp] = useState(user?.whatsappNumber ?? '');
  const [editDriveFolder, setEditDriveFolder] = useState(user?.googleDriveFolder ?? '');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<PaymentMethodType>('JazzCash');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const [commissionInput, setCommissionInput] = useState(String(user?.defaultCommissionPer10k ?? 40));
  const [savingCommission, setSavingCommission] = useState(false);
  const [commissionError, setCommissionError] = useState<string | null>(null);

  // Field focus states for styling
  const [pubgIdFocused, setPubgIdFocused] = useState(false);
  const [nicknameFocused, setNicknameFocused] = useState(false);
  const [whatsappFocused, setWhatsappFocused] = useState(false);
  const [driveFocused, setDriveFocused] = useState(false);
  const [accountNumberFocused, setAccountNumberFocused] = useState(false);
  const [accountTitleFocused, setAccountTitleFocused] = useState(false);
  const [commissionFocused, setCommissionFocused] = useState(false);

  useEffect(() => {
    if (user?.defaultCommissionPer10k !== undefined) {
      setCommissionInput(String(user.defaultCommissionPer10k));
    }
  }, [user?.defaultCommissionPer10k]);

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

  const openEditContactModal = () => {
    setEditWhatsapp(user?.whatsappNumber ?? '');
    setEditDriveFolder(user?.googleDriveFolder ?? '');
    setContactError(null);
    setContactModalVisible(true);
  };

  const handleSaveContactInfo = async () => {
    const cleanWhatsapp = editWhatsapp.trim();
    const cleanDrive = editDriveFolder.trim();

    if (!cleanWhatsapp) {
      setContactError('WhatsApp number is required.');
      return;
    }
    if (!cleanWhatsapp.startsWith('+92')) {
      setContactError('WhatsApp number must start with country code +92 (e.g. +923001234567)');
      return;
    }
    if (!/^\+92\d{10}$/.test(cleanWhatsapp)) {
      setContactError('WhatsApp number must have +92 followed by exactly 10 digits.');
      return;
    }

    if (!user) return;
    try {
      setContactLoading(true);
      setContactError(null);
      await profileService.update(user.uid, {
        whatsappNumber: cleanWhatsapp,
        googleDriveFolder: cleanDrive || null,
      });
      setUser({
        ...user,
        whatsappNumber: cleanWhatsapp,
        googleDriveFolder: cleanDrive || null,
      });
      setContactModalVisible(false);
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Failed to update. Please try again.');
    } finally {
      setContactLoading(false);
    }
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

  const handleSaveCommission = async () => {
    const val = Number(commissionInput);
    if (isNaN(val) || val < 0) {
      setCommissionError('Commission must be a valid positive number');
      return;
    }
    if (!user) return;
    try {
      setSavingCommission(true);
      setCommissionError(null);
      await profileService.update(user.uid, {
        defaultCommissionPer10k: val,
      });
      setUser({
        ...user,
        defaultCommissionPer10k: val,
      });
      Alert.alert('Success', 'Default commission updated successfully!');
    } catch (err) {
      setCommissionError(err instanceof Error ? err.message : 'Failed to update commission');
    } finally {
      setSavingCommission(false);
    }
  };

  const openAddMethod = () => {
    setEditingIndex(null);
    setSelectedType('JazzCash');
    setAccountNumber('');
    setAccountTitle('');
    setPayError(null);
    setTypePickerOpen(false);
    setPayModalVisible(true);
  };

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
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      <TacticalGrid />
      <CornerReticles />

      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        {role === 'admin' && (
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-[#D4A017] text-base font-bold">← Back</Text>
          </TouchableOpacity>
        )}
        <Text className="text-white text-base font-bold uppercase">Profile Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        
        {/* ── Avatar + Identity Card ── */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
          <View className="flex-row items-center gap-4 mb-4">
            <View style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212, 160, 23, 0.1)' }} className="w-16 h-16 rounded-full items-center justify-center">
              <Text className="text-[#D4A017] text-2xl font-bold">
                {user?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-bold">{user?.displayName ?? 'Operator'}</Text>
              <Text className="text-surface-300 text-xs mb-1.5">{user?.email ?? ''}</Text>
              
              <View style={{ backgroundColor: badge.bg, borderRadius: 2 }} className="self-start px-2.5 py-0.5">
                <Text style={{ letterSpacing: 0.5 }} className={`text-[10px] font-bold uppercase ${badge.text}`}>
                  {badge.label}
                </Text>
              </View>
            </View>
            {user?.isVerified && (
              <View className="bg-green-500/10 border border-green-500/20 rounded px-2 py-0.5">
                <Text className="text-green-400 text-[9px] font-bold uppercase">Verified</Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View className="flex-row gap-3">
            {[
              { label: 'Reputation', value: String(user?.reputation ?? 0) },
              { label: 'POP Sent', value: String(user?.totalPopSent ?? 0) },
              { label: 'POP Recv', value: String(user?.totalPopReceived ?? 0) },
            ].map(({ label, value }) => (
              <View key={label} style={{ backgroundColor: 'rgba(30, 41, 59, 0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }} className="flex-1 items-center p-3">
                <Text className="text-white font-bold text-base">{value}</Text>
                <Text className="text-surface-300 text-[10px] uppercase mt-0.5">{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── PUBG Details Card ── */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase">PUBG Details</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text className="text-[#D4A017] text-xs font-bold uppercase">Edit</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between py-2.5 border-b border-white/5">
            <Text className="text-surface-300 text-xs">PUBG ID</Text>
            <Text className="text-white text-xs font-semibold">{user?.pubgId ?? 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between py-2.5 border-b border-white/5">
            <Text className="text-surface-300 text-xs">Nickname</Text>
            <Text className="text-white text-xs font-semibold">{user?.pubgNickname ?? 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between py-2.5">
            <Text className="text-surface-300 text-xs">Server</Text>
            <Text className="text-white text-xs font-semibold">{user?.pubgServer ?? 'Not set'}</Text>
          </View>
        </View>

        {/* ── Contact & Storage Card ── */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase">Contact & Storage</Text>
            <TouchableOpacity onPress={openEditContactModal}>
              <Text className="text-[#D4A017] text-xs font-bold uppercase">Edit</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between py-2.5 border-b border-white/5">
            <Text className="text-surface-300 text-xs">WhatsApp Number</Text>
            <Text className="text-white text-xs font-semibold">{user?.whatsappNumber ?? 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between py-2.5">
            <Text className="text-surface-300 text-xs">Google Drive Folder</Text>
            <Text className="text-white text-xs font-semibold flex-1 text-right ml-4" numberOfLines={1}>
              {user?.googleDriveFolder ?? 'Not set'}
            </Text>
          </View>
        </View>

        {/* ── Payment Details (seller/supplier only) ── */}
        {(role === 'seller' || role === 'supplier') && (
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase">Payment Methods</Text>
              <TouchableOpacity onPress={openAddMethod}>
                <Text className="text-[#D4A017] text-xs font-bold uppercase">+ Add</Text>
              </TouchableOpacity>
            </View>

            {savedMethods.length === 0 ? (
              <Text className="text-surface-400 text-xs mt-1">
                No payment methods yet. Tap + Add to add JazzCash, EasyPaisa, Bank, etc.
              </Text>
            ) : (
              savedMethods.map((m, i) => (
                <View
                  key={i}
                  style={{ borderBottomWidth: i < savedMethods.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                  className="flex-row items-center py-3"
                >
                  <Text className="text-lg mr-3">{METHOD_ICONS[m.type]}</Text>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-xs">{m.type}</Text>
                    {m.accountTitle ? (
                      <Text className="text-surface-400 text-[10px] mt-0.5">{m.accountTitle}</Text>
                    ) : null}
                    <Text className="text-surface-300 text-xs mt-0.5">{m.accountNumber}</Text>
                  </View>
                  
                  {/* Actions */}
                  <TouchableOpacity
                    onPress={() => Clipboard.setStringAsync(m.accountNumber)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}
                    className="p-2 mr-2"
                  >
                    <Text className="text-white text-xs">📋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openEditMethod(i)}
                    style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212, 160, 23, 0.08)', borderRadius: 2 }}
                    className="px-2.5 py-1.5 mr-2"
                  >
                    <Text className="text-[#D4A017] text-[10px] font-bold uppercase">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteMethod(i)}
                    style={{ borderWidth: 1, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 2 }}
                    className="px-2.5 py-1.5"
                  >
                    <Text className="text-[#ef4444] text-[10px] font-bold uppercase">✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Default Commission Settings (seller only) ── */}
        {role === 'seller' && (
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
            <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase mb-2">Default Commission</Text>
            <Text className="text-surface-300 text-xxs mb-3 leading-relaxed">
              Set your default profit margin commission per 10k POP. This will automatically deduct from the Buyer Rate when creating a Supplier Request.
            </Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: commissionFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(30, 41, 59, 0.35)',
                    color: '#fff',
                    borderRadius: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 13,
                  }}
                  value={commissionInput}
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '');
                    setCommissionInput(clean);
                  }}
                  onFocus={() => setCommissionFocused(true)}
                  onBlur={() => setCommissionFocused(false)}
                  placeholder="e.g. 40"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                onPress={handleSaveCommission}
                style={{
                  borderWidth: 1.5,
                  borderColor: '#D4A017',
                  backgroundColor: 'rgba(212,160,23,0.15)',
                  borderRadius: 2,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                }}
                disabled={savingCommission}
              >
                {savingCommission ? (
                  <ActivityIndicator color="#D4A017" size="small" />
                ) : (
                  <Text className="text-[#D4A017] font-bold text-xs uppercase">Save</Text>
                )}
              </TouchableOpacity>
            </View>
            {commissionError ? (
              <Text className="text-red-400 text-xxs mt-1.5">{commissionError}</Text>
            ) : null}
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="mb-4 overflow-hidden">
          {[
            { label: '🔄 Redo Onboarding', action: handleGoToOnboarding },
          ].map(({ label, action }, i, arr) => (
            <TouchableOpacity
              key={label}
              onPress={action}
              style={{ borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}
              className="px-4 py-3.5 flex-row justify-between items-center"
            >
              <Text className="text-white text-xs font-semibold uppercase">{label}</Text>
              <Text className="text-surface-300">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity
          style={{
            borderWidth: 1.5,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 2,
            paddingVertical: 14,
            alignItems: 'center',
          }}
          onPress={handleSignOut}
        >
          <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }} className="uppercase">Sign Out</Text>
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
            style={{ maxHeight: '85%' }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ backgroundColor: '#090d16', borderTopWidth: 2, borderTopColor: '#D4A017' }} className="p-6">
              <Text className="text-white text-base font-bold uppercase mb-1">
                {editingIndex !== null ? 'Update Payment Method' : 'Add Payment Method'}
              </Text>
              <Text className="text-surface-300 text-xs mb-5">
                {editingIndex !== null
                  ? 'Edit your account details below.'
                  : 'Choose a payment type and enter your account number.'}
              </Text>

              {/* ── Payment Type Dropdown ── */}
              <Text className="text-surface-300 text-xxs font-bold uppercase mb-2">Payment Type *</Text>
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(30, 41, 59, 0.35)', borderRadius: 4 }}
                className="px-4 py-3 mb-1 flex-row justify-between items-center"
                onPress={() => setTypePickerOpen((o) => !o)}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg">{METHOD_ICONS[selectedType]}</Text>
                  <Text className="text-white text-sm font-semibold">{selectedType}</Text>
                </View>
                <Text className="text-[#D4A017]">{typePickerOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {typePickerOpen && (
                <View style={{ borderWidth: 1.5, borderColor: 'rgba(212, 160, 23, 0.2)', backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: 4 }} className="mb-4 overflow-hidden">
                  {PAYMENT_TYPES.map((pt) => (
                    <TouchableOpacity
                      key={pt}
                      className={`px-4 py-3 flex-row items-center gap-3 ${
                        pt === selectedType ? 'bg-[#D4A017]/10' : ''
                      }`}
                      onPress={() => {
                        setSelectedType(pt);
                        setTypePickerOpen(false);
                      }}
                    >
                      <Text className="text-lg">{METHOD_ICONS[pt]}</Text>
                      <Text className={`text-xs ${
                        pt === selectedType ? 'text-[#D4A017] font-bold' : 'text-white'
                      }`}>{pt}</Text>
                      {pt === selectedType && <Text className="text-[#D4A017] ml-auto">✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* ── Account Number ── */}
              <View className="mb-4 mt-2">
                <Text className="text-surface-300 text-xxs font-bold uppercase mb-2">Account Number *</Text>
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: accountNumberFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(30, 41, 59, 0.35)',
                    color: '#fff',
                    borderRadius: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 13,
                  }}
                  value={accountNumber}
                  onChangeText={(v) => { setAccountNumber(v); setPayError(null); }}
                  onFocus={() => setAccountNumberFocused(true)}
                  onBlur={() => setAccountNumberFocused(false)}
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

              {/* ── Account Title ── */}
              <View className="mb-5">
                <Text className="text-surface-300 text-xxs font-bold uppercase mb-2">
                  {selectedType === 'Bank Transfer' ? 'Account Title / Bank Name' : 'Account Name (optional)'}
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: accountTitleFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(30, 41, 59, 0.35)',
                    color: '#fff',
                    borderRadius: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 13,
                  }}
                  value={accountTitle}
                  onChangeText={setAccountTitle}
                  onFocus={() => setAccountTitleFocused(true)}
                  onBlur={() => setAccountTitleFocused(false)}
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
                <View className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2.5 mb-4">
                  <Text className="text-red-400 text-xxs">{payError}</Text>
                </View>
              )}

              <View className="flex-row gap-3">
                <TouchableOpacity
                  style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}
                  className="flex-1 py-3.5 items-center"
                  onPress={() => setPayModalVisible(false)}
                  disabled={payLoading}
                >
                  <Text className="text-white font-bold text-xs uppercase">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                  className="flex-1 py-3.5 items-center"
                  onPress={handleSaveMethod}
                  disabled={payLoading}
                >
                  {payLoading ? (
                    <ActivityIndicator color="#D4A017" />
                  ) : (
                    <Text className="text-[#D4A017] font-bold text-xs uppercase">
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
          <View style={{ backgroundColor: '#090d16', borderTopWidth: 2, borderTopColor: '#D4A017' }} className="p-6">
            <Text className="text-white text-base font-bold uppercase mb-1">Edit PUBG Info</Text>
            <Text className="text-surface-300 text-xs mb-6">
              Update your PUBG ID and in-game nickname.
            </Text>

            <View className="mb-4">
              <Text className="text-surface-300 text-xxs font-bold uppercase mb-2">PUBG ID</Text>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: pubgIdFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(30, 41, 59, 0.35)',
                  color: '#fff',
                  borderRadius: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 13,
                }}
                value={editPubgId}
                onChangeText={(v) => { setEditPubgId(v); setEditError(null); }}
                onFocus={() => setPubgIdFocused(true)}
                onBlur={() => setPubgIdFocused(false)}
                placeholder="e.g. 5123456789"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>

            <View className="mb-5">
              <Text className="text-surface-300 text-xxs font-bold uppercase mb-2">PUBG Nickname</Text>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: nicknameFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(30, 41, 59, 0.35)',
                  color: '#fff',
                  borderRadius: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 13,
                }}
                value={editNickname}
                onChangeText={(v) => { setEditNickname(v); setEditError(null); }}
                onFocus={() => setNicknameFocused(true)}
                onBlur={() => setNicknameFocused(false)}
                placeholder="e.g. ProSniper99"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>

            {editError && (
              <View className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2.5 mb-4">
                <Text className="text-red-400 text-xxs">{editError}</Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}
                className="flex-1 py-3.5 items-center"
                onPress={() => setEditModalVisible(false)}
                disabled={editLoading}
              >
                <Text className="text-white font-bold text-xs uppercase">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                className="flex-1 py-3.5 items-center"
                onPress={handleSavePubgInfo}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator color="#D4A017" />
                ) : (
                  <Text className="text-[#D4A017] font-bold text-xs uppercase">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Contact Info Modal ── */}
      <Modal
        visible={contactModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View style={{ backgroundColor: '#090d16', borderTopWidth: 2, borderTopColor: '#D4A017' }} className="p-6">
            <Text className="text-white text-base font-bold uppercase mb-1">Edit Contact & Storage</Text>
            <Text className="text-surface-300 text-xs mb-6">
              Provide your active WhatsApp number and optional Google Drive folder URL.
            </Text>

            <View className="mb-4">
              <Text className="text-surface-300 text-xxs font-bold uppercase mb-2">WhatsApp Number *</Text>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: whatsappFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(30, 41, 59, 0.35)',
                  color: '#fff',
                  borderRadius: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 13,
                }}
                value={editWhatsapp}
                onChangeText={(v) => { setEditWhatsapp(v); setContactError(null); }}
                onFocus={() => setWhatsappFocused(true)}
                onBlur={() => setWhatsappFocused(false)}
                placeholder="e.g. +923001234567"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
              />
              <Text className="text-surface-400 text-[10px] mt-1.5">
                Must start with country code +92 (exactly 12 characters, e.g., +923001234567).
              </Text>
            </View>

            <View className="mb-5">
              <Text className="text-surface-300 text-xxs font-bold uppercase mb-2">Google Drive Folder URL (optional)</Text>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: driveFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(30, 41, 59, 0.35)',
                  color: '#fff',
                  borderRadius: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 12,
                }}
                value={editDriveFolder}
                onChangeText={(v) => { setEditDriveFolder(v); setContactError(null); }}
                onFocus={() => setDriveFocused(true)}
                onBlur={() => setDriveFocused(false)}
                placeholder="e.g. https://drive.google.com/drive/folders/..."
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {contactError && (
              <View className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2.5 mb-4">
                <Text className="text-red-400 text-xxs">{contactError}</Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}
                className="flex-1 py-3.5 items-center"
                onPress={() => setContactModalVisible(false)}
                disabled={contactLoading}
              >
                <Text className="text-white font-bold text-xs uppercase">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                className="flex-1 py-3.5 items-center"
                onPress={handleSaveContactInfo}
                disabled={contactLoading}
              >
                {contactLoading ? (
                  <ActivityIndicator color="#D4A017" />
                ) : (
                  <Text className="text-[#D4A017] font-bold text-xs uppercase">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
