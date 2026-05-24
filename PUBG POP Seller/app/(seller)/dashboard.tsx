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

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { useSellerRequests } from '@/features/requests/hooks/useRequests';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.74;

const SELLER_MENU = [
  { label: 'Dashboard',     icon: '⊞', href: '/(seller)/dashboard' },
  { label: 'Post Request',  icon: '＋', href: '/(seller)/post-request' },
  { label: 'My Requests',   icon: '📋', href: '/(seller)/my-requests' },
  { label: 'Buyer Orders',  icon: '🛒', href: '/(seller)/orders' },
  { label: 'Analytics',     icon: '📊', href: '/(seller)/analytics' },
  { label: 'Profile',       icon: '👤', href: '/(seller)/profile' },
];

function SellerDrawer({
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
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View
          style={{
            width: DRAWER_WIDTH,
            backgroundColor: '#1e293b',
            height: '100%',
            paddingTop: 56,
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* User info */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#334155', marginBottom: 8 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Text style={{ color: '#f59e0b', fontSize: 20, fontWeight: 'bold' }}>
                {user?.displayName?.charAt(0)?.toUpperCase() ?? 'S'}
              </Text>
            </View>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{user?.displayName}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>{user?.email}</Text>
            <View style={{ alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.15)' }}>
              <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: '700' }}>Seller</Text>
            </View>
          </View>

          {/* Menu items */}
          {SELLER_MENU.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => { onClose(); router.push(item.href as never); }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  backgroundColor: isActive ? 'rgba(245,158,11,0.12)' : 'transparent',
                  borderLeftWidth: isActive ? 3 : 0,
                  borderLeftColor: '#f59e0b',
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 14 }}>{item.icon}</Text>
                <Text style={{ color: isActive ? '#fcd34d' : '#cbd5e1', fontWeight: isActive ? '700' : '500', fontSize: 15 }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Sign out */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={{ marginTop: 'auto', marginHorizontal: 20, marginBottom: 36, padding: 14, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', alignItems: 'center' }}
          >
            <Text style={{ color: '#f87171', fontWeight: '600' }}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Tap outside to close */}
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} activeOpacity={1} onPress={onClose} />
      </View>
    </Modal>
  );
}

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const { requests } = useSellerRequests(user?.uid);
  const { data: analytics } = useAnalytics(user?.uid);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openRequests  = requests.filter((r) => ['open', 'partially_booked'].includes(r.status));
  const activeRequests = requests.filter((r) => ['fully_booked', 'in_progress'].includes(r.status));
  const completedRequests = requests.filter((r) => r.status === 'completed');

  const totalPopManaged = completedRequests.reduce((s, r) => s + r.totalPopAmount, 0);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => setDrawerOpen(true)} className="mr-3 p-2 rounded-lg bg-surface-100">
          <View style={{ gap: 4 }}>
            <View className="w-5 h-0.5 bg-white rounded" />
            <View className="w-5 h-0.5 bg-white rounded" />
            <View className="w-5 h-0.5 bg-white rounded" />
          </View>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-surface-300 text-xs">Welcome back,</Text>
          <Text className="text-white text-base font-bold">{user?.displayName ?? 'Seller'}</Text>
        </View>
        <View className="px-3 py-1 rounded-full bg-yellow-500/20">
          <Text className="text-yellow-400 text-xs font-bold">Seller</Text>
        </View>
      </View>

      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Today’s profit banner */}
        {(analytics?.today.totalProfit ?? 0) > 0 && (
          <TouchableOpacity
            className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-4 flex-row items-center"
            onPress={() => router.push('/(seller)/analytics' as never)}
          >
            <View className="flex-1">
              <Text className="text-green-400 text-xs font-semibold mb-0.5">💸 Today’s Profit</Text>
              <Text className="text-white text-2xl font-bold">
                PKR {analytics!.today.totalProfit.toLocaleString()}
              </Text>
              <Text className="text-surface-400 text-xs mt-0.5">
                {analytics!.today.transactionCount} deal{analytics!.today.transactionCount !== 1 ? 's' : ''} today
              </Text>
            </View>
            <Text className="text-green-400 text-xl">›</Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-yellow-500/20">
            <Text className="text-yellow-400 text-3xl font-bold">{openRequests.length}</Text>
            <Text className="text-surface-300 text-xs mt-1">Open Requests</Text>
          </View>
          <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-surface-200">
            <Text className="text-primary-400 text-3xl font-bold">{activeRequests.length}</Text>
            <Text className="text-surface-300 text-xs mt-1">In Progress</Text>
          </View>
          <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-green-500/20">
            <Text className="text-green-400 text-2xl font-bold">
              {totalPopManaged >= 1000 ? `${(totalPopManaged / 1000).toFixed(0)}k` : String(totalPopManaged)}
            </Text>
            <Text className="text-surface-300 text-xs mt-1">POP Done</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Quick Actions</Text>

          <TouchableOpacity
            className="bg-yellow-500 rounded-xl py-4 px-4 mb-3 flex-row items-center"
            onPress={() => router.push('/(seller)/post-request' as never)}
          >
            <Text className="text-white font-bold flex-1">＋ Post New POP Request</Text>
            <Text className="text-white/70">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface-200 rounded-xl py-4 px-4 mb-3 flex-row items-center"
            onPress={() => router.push('/(seller)/my-requests' as never)}
          >
            <Text className="text-white font-medium flex-1">Manage Requests & Bookings</Text>
            {openRequests.length > 0 && (
              <View className="bg-yellow-500 rounded-full w-6 h-6 items-center justify-center mr-2">
                <Text className="text-white text-xs font-bold">{openRequests.length}</Text>
              </View>
            )}
            <Text className="text-surface-300">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface-200 rounded-xl py-4 px-4 mb-3 flex-row items-center"
            onPress={() => router.push('/(seller)/orders' as never)}
          >
            <Text className="text-white font-medium flex-1">Buyer Orders</Text>
            <Text className="text-surface-300">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface-200 rounded-xl py-4 px-4 mb-3 flex-row items-center"
            onPress={() => router.push('/(seller)/analytics' as never)}
          >
            <View className="flex-1">
              <Text className="text-white font-medium">Analytics &amp; Profit</Text>
              <Text className="text-surface-400 text-xs">
                This month: PKR {(analytics?.thisMonth.totalProfit ?? 0).toLocaleString()}
              </Text>
            </View>
            <Text className="text-surface-300">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-4 px-4 flex-row items-center"
            onPress={() => router.push('/(seller)/log-deal' as never)}
          >
            <Text className="text-yellow-400 font-medium flex-1">📝 Log WhatsApp Deal</Text>
            <Text className="text-yellow-500">›</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Requests */}
        <View className="bg-surface-100 rounded-2xl p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-semibold">Recent Requests</Text>
            <TouchableOpacity onPress={() => router.push('/(seller)/my-requests' as never)}>
              <Text className="text-yellow-400 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {requests.slice(0, 4).length === 0 ? (
            <Text className="text-surface-300 text-sm text-center py-4">
              No requests yet. Post your first POP request.
            </Text>
          ) : (
            requests.slice(0, 4).map((r) => (
              <TouchableOpacity
                key={r.id}
                className="flex-row justify-between items-center py-3 border-b border-surface-200"
                onPress={() => router.push('/(seller)/my-requests' as never)}
              >
                <View>
                  <Text className="text-white text-sm font-semibold">
                    {r.totalPopAmount.toLocaleString()} POP
                  </Text>
                  <Text className="text-surface-300 text-xs">
                    Rate: {r.ratePer10k}/10k
                  </Text>
                </View>
                <View className="items-end">
                  <View className={`px-2 py-0.5 rounded-full ${
                    r.status === 'open' ? 'bg-yellow-500/20' :
                    r.status === 'completed' ? 'bg-green-500/20' : 'bg-primary-500/20'
                  }`}>
                    <Text className={`text-xs font-semibold capitalize ${
                      r.status === 'open' ? 'text-yellow-400' :
                      r.status === 'completed' ? 'text-green-400' : 'text-primary-400'
                    }`}>
                      {r.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <Text className="text-surface-300 text-xs mt-1">
                    {r.remainingAmount.toLocaleString()} left
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <SellerDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentPath="/(seller)/dashboard"
      />
    </SafeAreaView>
  );
}
