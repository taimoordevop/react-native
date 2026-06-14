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
import { useMyOrders } from '@/features/orders/hooks/useOrders';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.74;

const SELLER_MENU = [
  { label: 'DASHBOARD',         icon: '⊞', href: '/(seller)/dashboard' },
  { label: 'POST REQUEST',      icon: '＋', href: '/(seller)/post-request' },
  { label: 'BUYER REQUESTS',    icon: '🛒', href: '/(seller)/buyer-requests' },
  { label: 'SUPPLIER REQUESTS', icon: '🏪', href: '/(seller)/supplier-requests' },
  { label: 'SUPPLIER BOOKINGS', icon: '⚡', href: '/(seller)/bookings' },
  { label: 'BUYER ORDERS',      icon: '🛒', href: '/(seller)/orders' },
  { label: 'ANALYTICS',         icon: '📊', href: '/(seller)/analytics' },
  { label: 'PROFILE',           icon: '👤', href: '/(seller)/profile' },
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
            backgroundColor: '#090d16',
            height: '100%',
            paddingTop: 56,
            borderRightWidth: 1.5,
            borderRightColor: 'rgba(212, 160, 23, 0.3)',
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* User info */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 160, 23, 0.2)', marginBottom: 8 }}>
            <View style={{ width: 48, height: 48, borderWidth: 1.5, borderColor: '#D4A017', borderRadius: 24, backgroundColor: 'rgba(212, 160, 23, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Text style={{ color: '#D4A017', fontSize: 20, fontWeight: 'bold' }}>
                {user?.displayName?.charAt(0)?.toUpperCase() ?? 'S'}
              </Text>
            </View>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{user?.displayName}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>{user?.email}</Text>
            <View style={{ alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#D4A017', borderRadius: 4, backgroundColor: 'rgba(212, 160, 23, 0.15)' }}>
              <Text style={{ color: '#D4A017', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>SELLER</Text>
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
                  backgroundColor: isActive ? 'rgba(212, 160, 23, 0.12)' : 'transparent',
                  borderLeftWidth: isActive ? 3 : 0,
                  borderLeftColor: '#D4A017',
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 14, color: isActive ? '#D4A017' : '#475569' }}>{item.icon}</Text>
                <Text style={{ color: isActive ? '#D4A017' : '#cbd5e1', fontWeight: isActive ? '700' : '500', fontSize: 13, letterSpacing: 1 }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Sign out */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={{ marginTop: 'auto', marginHorizontal: 20, marginBottom: 36, padding: 14, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 4, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', alignItems: 'center' }}
          >
            <Text style={{ color: '#f87171', fontWeight: 'bold', fontSize: 13, letterSpacing: 1.5 }}>ABORT MISSION (SIGN OUT)</Text>
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
  const { orders } = useMyOrders(user?.uid, 'supplier');
  const { data: analytics } = useAnalytics(user?.uid);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openRequests  = requests.filter((r) => ['open', 'partially_booked'].includes(r.status));
  const openBuyerRequests = requests.filter((r) => r.targetAudience === 'buyer' && ['open', 'partially_booked'].includes(r.status));
  const openSupplierRequests = requests.filter((r) => r.targetAudience === 'supplier' && ['open', 'partially_booked'].includes(r.status));
  
  // Calculate active and completed count directly from actual Buyer Orders
  const activeOrders = orders.filter((o) => ['paid', 'in_progress', 'proof_submitted', 'verified', 'payout_submitted'].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalPopManaged = completedOrders.reduce((s, o) => s + o.popAmount, 0);

  return (
    <SafeAreaView className="flex-1 bg-[#090d16]">
      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <TouchableOpacity 
          onPress={() => setDrawerOpen(true)} 
          style={{
            borderWidth: 1,
            borderColor: 'rgba(212, 160, 23, 0.3)',
            backgroundColor: 'rgba(212, 160, 23, 0.05)',
            padding: 10,
            borderRadius: 4,
          }}
          className="mr-3"
        >
          <View style={{ gap: 4 }}>
            <View className="w-5 h-0.5 bg-[#D4A017] rounded" />
            <View className="w-5 h-0.5 bg-[#D4A017] rounded" />
            <View className="w-5 h-0.5 bg-[#D4A017] rounded" />
          </View>
        </TouchableOpacity>
        <View className="flex-1">
          <Text style={{ letterSpacing: 1 }} className="text-surface-400 text-xxs uppercase">OPERATOR ACTIVE</Text>
          <Text className="text-white text-base font-bold">{user?.displayName ?? 'Seller'}</Text>
        </View>
        <View style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="px-3 py-1">
          <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-xs font-bold uppercase">Seller</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Background Overlay */}
        <TacticalGrid />
        <CornerReticles />

        {/* Verification Pending Banner */}
        {user?.sellerApprovalStatus === 'pending' && (
          <View 
            style={{
              borderWidth: 1.5,
              borderColor: 'rgba(212, 160, 23, 0.4)',
              borderRadius: 4,
              backgroundColor: 'rgba(212, 160, 23, 0.08)',
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] font-bold mb-1 uppercase">⏳ Verification Pending</Text>
            <Text className="text-surface-300 text-xs leading-5">
              Your Seller verification request is currently under review by our admin team. Other Seller features will be unlocked once approved.
            </Text>
          </View>
        )}

        {/* View Analytics Card */}
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            borderWidth: 1.5,
            borderColor: 'rgba(34, 197, 94, 0.3)',
            borderRadius: 4,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => router.push('/(seller)/analytics' as never)}
        >
          <View className="flex-1">
            <Text style={{ letterSpacing: 1.5 }} className="text-green-400 text-xs font-bold uppercase mb-1">📊 TODAY’S PROFIT</Text>
            <Text className="text-white text-2xl font-bold">
              PKR {(analytics?.today.totalProfit ?? 0).toLocaleString()}
            </Text>
            <Text className="text-surface-400 text-xs mt-0.5">
              {(analytics?.today.transactionCount ?? 0)} deal{(analytics?.today.transactionCount ?? 0) !== 1 ? 's' : ''} today · Tap to view full analytics
            </Text>
          </View>
          <Text className="text-green-400 text-xl font-bold">›</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View className="flex-row gap-3 mb-5">
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.3)', borderRadius: 4 }} className="flex-grow flex-1 p-4">
            <Text className="text-[#D4A017] text-3xl font-bold">{openRequests.length}</Text>
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs uppercase mt-1">Open Requests</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 4 }} className="flex-grow flex-1 p-4">
            <Text className="text-white text-3xl font-bold">{activeOrders.length}</Text>
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs uppercase mt-1">In Progress</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 4 }} className="flex-grow flex-1 p-4">
            <Text className="text-green-400 text-3xl font-bold">
              {totalPopManaged >= 1000 ? `${(totalPopManaged / 1000).toFixed(0)}k` : String(totalPopManaged)}
            </Text>
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs uppercase mt-1">POP Done</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4 mb-4">
          <Text style={{ letterSpacing: 1.5 }} className="text-white font-bold text-xs uppercase mb-3">TACTICAL OPERATIONS</Text>

          <TouchableOpacity
            style={{
              borderWidth: 1.5,
              borderColor: '#D4A017',
              borderRadius: 2,
              backgroundColor: 'rgba(212, 160, 23, 0.15)',
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(seller)/post-request' as never)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1.5 }} className="flex-1 uppercase">＋ Post New POP Request</Text>
            <Text className="text-white/70">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: 4,
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(seller)/buyer-requests' as never)}
          >
            <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-semibold flex-1 uppercase">Manage Buyer Requests</Text>
            {openBuyerRequests.length > 0 && (
              <View style={{ backgroundColor: 'rgba(212, 160, 23, 0.15)', borderColor: '#D4A017', borderWidth: 1 }} className="px-2 py-0.5 rounded-full mr-2">
                <Text className="text-[#D4A017] text-[10px] font-bold">{openBuyerRequests.length}</Text>
              </View>
            )}
            <Text className="text-surface-300">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: 4,
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(seller)/supplier-requests' as never)}
          >
            <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-semibold flex-1 uppercase">Manage Supplier Requests</Text>
            {openSupplierRequests.length > 0 && (
              <View style={{ backgroundColor: 'rgba(212, 160, 23, 0.15)', borderColor: '#D4A017', borderWidth: 1 }} className="px-2 py-0.5 rounded-full mr-2">
                <Text className="text-[#D4A017] text-[10px] font-bold">{openSupplierRequests.length}</Text>
              </View>
            )}
            <Text className="text-surface-300">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: 4,
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(seller)/bookings' as never)}
          >
            <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-semibold flex-1 uppercase">Supplier Bookings</Text>
            <Text className="text-surface-300">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: 4,
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(seller)/orders' as never)}
          >
            <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-semibold flex-1 uppercase">Buyer Orders</Text>
            <Text className="text-surface-300">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: 4,
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(seller)/analytics' as never)}
          >
            <View className="flex-1">
              <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-semibold uppercase">Analytics &amp; Profit</Text>
              <Text className="text-surface-400 text-xxs mt-0.5">
                This month: PKR {(analytics?.thisMonth.totalProfit ?? 0).toLocaleString()}
              </Text>
            </View>
            <Text className="text-surface-300">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'rgba(212, 160, 23, 0.3)',
              borderRadius: 4,
              backgroundColor: 'rgba(212, 160, 23, 0.05)',
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(seller)/log-deal' as never)}
          >
            <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-xs font-semibold flex-1 uppercase">📝 Log WhatsApp Deal</Text>
            <Text className="text-[#D4A017]">›</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Requests */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ letterSpacing: 1.5 }} className="text-white font-bold text-xs uppercase">RECENT CHANNELS</Text>
            <View className="flex-row gap-2 items-center">
              <TouchableOpacity onPress={() => router.push('/(seller)/buyer-requests' as never)}>
                <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-xxs font-bold uppercase">Buyer</Text>
              </TouchableOpacity>
              <Text className="text-surface-500 text-xs">|</Text>
              <TouchableOpacity onPress={() => router.push('/(seller)/supplier-requests' as never)}>
                <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-xxs font-bold uppercase">Supplier</Text>
              </TouchableOpacity>
            </View>
          </View>

          {requests.slice(0, 4).length === 0 ? (
            <Text className="text-surface-400 text-xs text-center py-4">
              No active channels. Deploy your first request protocol.
            </Text>
          ) : (
            requests.slice(0, 4).map((r) => (
              <TouchableOpacity
                key={r.id}
                style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                className="flex-row justify-between items-center py-3"
                onPress={() =>
                  router.push(
                    r.targetAudience === 'buyer'
                      ? '/(seller)/buyer-requests'
                      : '/(seller)/supplier-requests' as never
                  )
                }
              >
                <View>
                  <Text className="text-white text-sm font-semibold">
                    {r.totalPopAmount.toLocaleString()} POP
                  </Text>
                  <Text className="text-surface-400 text-xs">
                    Rate: {r.ratePer10k}/10k
                  </Text>
                </View>
                <View className="items-end">
                  <View style={{
                    borderWidth: 1,
                    borderColor: r.status === 'open' ? 'rgba(212, 160, 23, 0.4)' : r.status === 'completed' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255,255,255,0.2)',
                    backgroundColor: r.status === 'open' ? 'rgba(212, 160, 23, 0.1)' : r.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                    borderRadius: 4,
                  }} className="px-2 py-0.5">
                    <Text style={{
                      color: r.status === 'open' ? '#D4A017' : r.status === 'completed' ? '#22c55e' : '#cbd5e1',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }} className="capitalize">
                      {r.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <Text className="text-surface-400 text-xxs mt-1">
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
