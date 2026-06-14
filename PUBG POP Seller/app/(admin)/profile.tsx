import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { profileService } from '@/features/profile/services/profileService';

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

export default function AdminProfileScreen() {
  const { user, setUser, signOut } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const handleSignOut = async () => {
    await authService.signOut();
    signOut();
  };

  const handlePickAvatar = async () => {
    if (!user) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setUploading(true);
        const uploadedUrl = await profileService.uploadAvatar(user.uid, localUri);
        setUser({ ...user, photoURL: uploadedUrl });
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (err) {
      console.error('[AdminProfile] Avatar upload failed:', err);
      Alert.alert('Error', 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#090d16]">
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-[#D4A017] text-base font-bold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold uppercase">Admin Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TacticalGrid />
        <CornerReticles />

        {/* ── Admin Identity Card ── */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-5 mb-5 items-center">
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploading} className="relative mb-4">
            <View style={{ borderWidth: 2, borderColor: '#D4A017' }} className="w-24 h-24 rounded-full overflow-hidden items-center justify-center bg-black/40">
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-[#D4A017] text-3xl font-bold">
                  {user?.displayName?.charAt(0)?.toUpperCase() ?? 'A'}
                </Text>
              )}
            </View>
            {uploading ? (
              <View className="absolute inset-0 bg-black/60 rounded-full items-center justify-center">
                <ActivityIndicator color="#D4A017" size="small" />
              </View>
            ) : (
              <View style={{ backgroundColor: '#D4A017' }} className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center border-2 border-[#090d16]">
                <Text className="text-black text-xs font-bold">📷</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text className="text-white text-lg font-bold mb-0.5">{user?.displayName ?? 'Admin Operator'}</Text>
          <Text className="text-surface-300 text-xs mb-3">{user?.email ?? ''}</Text>

          <View style={{ borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.4)', backgroundColor: 'rgba(168, 85, 247, 0.12)', borderRadius: 2 }} className="px-3 py-1">
            <Text style={{ letterSpacing: 1 }} className="text-purple-400 text-xxs font-bold uppercase">System Administrator</Text>
          </View>
        </View>

        {/* ── Admin Management Console ── */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4 mb-5">
          <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs font-bold uppercase mb-3">Tactical Operations</Text>

          {[
            { label: '📊 Admin Dashboard', path: '/(admin)/dashboard' },
            { label: '👥 Manage Users', path: '/(admin)/users' },
            { label: '📦 All System Orders', path: '/(admin)/all-orders' },
            { label: '⚖️ Active Disputes', path: '/(admin)/disputes' },
            { label: '✓ Seller Approvals', path: '/(admin)/seller-approvals' },
          ].map(({ label, path }) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(path as never)}
              style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
              className="py-3.5 flex-row justify-between items-center"
            >
              <Text className="text-white text-sm font-semibold">{label}</Text>
              <Text className="text-surface-400">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── System Status Info ── */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4 mb-6">
          <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs font-bold uppercase mb-2">Security & Network</Text>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-surface-400 text-xs">Access Level</Text>
            <Text className="text-white text-xs font-bold">ROOT_ADMIN</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-surface-400 text-xs">Escrow Status</Text>
            <Text className="text-green-400 text-xs font-bold uppercase">Operational</Text>
          </View>
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
          <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }} className="uppercase">Terminate Session (Sign Out)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
