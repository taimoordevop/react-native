import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { authService } from '@/features/auth/services/authService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.72;

const ADMIN_MENU = [
  { label: 'Dashboard', icon: '⊞', href: '/(admin)/dashboard' },
  { label: 'Manage Users', icon: '👥', href: '/(admin)/users' },
  { label: 'All Orders', icon: '📋', href: '/(admin)/all-orders' },
  { label: 'Disputes', icon: '⚠️', href: '/(admin)/disputes' },
];

function AdminDrawer({
  visible,
  onClose,
  currentPath,
}: {
  visible: boolean;
  onClose: () => void;
  currentPath: string;
}) {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await authService.signOut();
    signOut();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Slide-in panel */}
        <View
          style={{
            width: DRAWER_WIDTH,
            backgroundColor: '#1e293b',
            height: '100%',
            paddingTop: 56,
            paddingHorizontal: 0,
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 16,
          }}
        >
          {/* User info */}
          <View className="px-5 pb-5 border-b border-surface-200 mb-2">
            <View className="w-12 h-12 rounded-full bg-purple-500/30 items-center justify-center mb-2">
              <Text className="text-purple-400 text-xl font-bold">
                {user?.displayName?.charAt(0)?.toUpperCase() ?? 'A'}
              </Text>
            </View>
            <Text className="text-white font-bold text-base">{user?.displayName}</Text>
            <Text className="text-surface-300 text-xs">{user?.email}</Text>
            <View className="self-start mt-1 px-2 py-0.5 rounded-full bg-purple-500/20">
              <Text className="text-purple-400 text-xs font-semibold">Admin</Text>
            </View>
          </View>

          {/* Menu items */}
          {ADMIN_MENU.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => {
                  onClose();
                  router.push(item.href as never);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  backgroundColor: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
                  borderLeftWidth: isActive ? 3 : 0,
                  borderLeftColor: '#8b5cf6',
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 12 }}>{item.icon}</Text>
                <Text
                  style={{
                    color: isActive ? '#c4b5fd' : '#cbd5e1',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: 15,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Sign out */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              marginTop: 'auto',
              marginHorizontal: 20,
              marginBottom: 32,
              padding: 14,
              backgroundColor: 'rgba(239,68,68,0.1)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.2)',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#f87171', fontWeight: '600' }}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Tap outside to close */}
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Admin Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          className="mr-3 p-2 rounded-lg bg-surface-100"
        >
          <View className="gap-1">
            <View className="w-5 h-0.5 bg-white rounded" />
            <View className="w-5 h-0.5 bg-white rounded" />
            <View className="w-5 h-0.5 bg-white rounded" />
          </View>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">Admin Dashboard</Text>
        <View className="px-3 py-1 rounded-full bg-purple-500/20">
          <Text className="text-purple-400 text-xs font-semibold">Admin</Text>
        </View>
      </View>

      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Welcome */}
        <View className="mb-5">
          <Text className="text-surface-300 text-sm">Logged in as</Text>
          <Text className="text-white text-xl font-bold">{user?.displayName ?? 'Admin'}</Text>
        </View>

        {/* Stats grid */}
        <View className="flex-row flex-wrap gap-3 mb-5">
          {[
            { label: 'Total Users', value: '—', color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
            { label: 'Total Orders', value: '—', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
            { label: 'Revenue (MTD)', value: 'PKR —', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Open Disputes', value: '—', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          ].map(({ label, value, color, bg }) => (
            <View
              key={label}
              className={`rounded-2xl border p-4 ${bg}`}
              style={{ width: (SCREEN_WIDTH - 48) / 2 }}
            >
              <Text className={`text-2xl font-bold mb-1 ${color}`}>{value}</Text>
              <Text className="text-surface-300 text-xs">{label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Quick Links</Text>
          {ADMIN_MENU.slice(1).map((item) => (
            <TouchableOpacity
              key={item.label}
              className="flex-row items-center py-3 border-b border-surface-200"
              onPress={() => router.push(item.href as never)}
            >
              <Text className="text-xl mr-3">{item.icon}</Text>
              <Text className="text-white font-medium flex-1">{item.label}</Text>
              <Text className="text-surface-300 text-lg">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info notice */}
        <View className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
          <Text className="text-purple-400 font-semibold mb-1">Admin Panel</Text>
          <Text className="text-surface-300 text-sm leading-5">
            Full stats (users, orders, revenue) will populate once live data is connected.
            Use the menu (☰) or Quick Links above to navigate.
          </Text>
        </View>
      </ScrollView>

      <AdminDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentPath="/(admin)/dashboard"
      />
    </SafeAreaView>
  );
}
