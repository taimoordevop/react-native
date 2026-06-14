import { router } from 'expo-router';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useMyOrders } from '@/features/orders/hooks/useOrders';

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

export default function BuyerDashboard() {
  const { user } = useAuthStore();
  const { orders } = useMyOrders(user?.uid, 'buyer');

  const activeOrders = orders.filter((o) =>
    ['pending_payment', 'paid', 'in_progress', 'proof_submitted'].includes(o.status),
  );
  const completedOrders = orders.filter((o) => o.status === 'completed');

  const popReceivedThisWeek = completedOrders
    .filter((o) => {
      const ts = o.completedAt?.toDate?.();
      if (!ts) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return ts >= weekAgo;
    })
    .reduce((sum, o) => sum + o.popAmount, 0);

  return (
    <SafeAreaView className="flex-1 bg-[#090d16]">
      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <View className="flex-1">
          <Text style={{ letterSpacing: 1 }} className="text-surface-400 text-xxs uppercase">OPERATOR ACTIVE</Text>
          <Text className="text-white text-base font-bold">{user?.displayName ?? 'Buyer'}</Text>
        </View>
        <View style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="px-3 py-1">
          <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-xs font-bold uppercase">Buyer</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Background Overlay */}
        <TacticalGrid />
        <CornerReticles />

        {/* Stats */}
        <View className="flex-row gap-3 mb-5">
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.3)', borderRadius: 4 }} className="flex-grow flex-1 p-4">
            <Text className="text-[#D4A017] text-3xl font-bold">{orders.length}</Text>
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs uppercase mt-1">Orders Placed</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 4 }} className="flex-grow flex-1 p-4">
            <Text className="text-white text-3xl font-bold">{activeOrders.length}</Text>
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs uppercase mt-1">Active</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 4 }} className="flex-grow flex-1 p-4">
            <Text className="text-green-400 text-3xl font-bold">
              {popReceivedThisWeek >= 1000
                ? `${(popReceivedThisWeek / 1000).toFixed(0)}k`
                : String(popReceivedThisWeek)}
            </Text>
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs uppercase mt-1">POP / Week</Text>
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
            onPress={() => router.push('/(buyer)/marketplace' as never)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1.5 }} className="flex-1 uppercase">＋ Browse POP Marketplace</Text>
            <Text className="text-[#D4A017]">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: 4,
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(buyer)/orders' as never)}
          >
            <Text style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }} className="flex-1 uppercase">My Active Orders</Text>
            {activeOrders.length > 0 && (
              <View style={{ backgroundColor: '#D4A017' }} className="rounded-full w-5 h-5 items-center justify-center mr-2">
                <Text className="text-black text-xxs font-bold">{activeOrders.length}</Text>
              </View>
            )}
            <Text className="text-surface-400">›</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ letterSpacing: 1 }} className="text-white font-bold text-xs uppercase">Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/(buyer)/orders' as never)}>
              <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-xxs font-bold uppercase">View All</Text>
            </TouchableOpacity>
          </View>

          {orders.slice(0, 3).length === 0 ? (
            <Text className="text-surface-300 text-xs text-center py-6 leading-relaxed">
              No orders yet — browse the marketplace to get started.
            </Text>
          ) : (
            orders.slice(0, 3).map((o, index, arr) => (
              <TouchableOpacity
                key={o.id}
                style={{ borderBottomWidth: index === arr.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                className="flex-row justify-between items-center py-3"
                onPress={() => router.push(`/orders/${o.id}` as never)}
              >
                <View>
                  <Text className="text-white text-sm font-bold">
                    {o.popAmount.toLocaleString()} POP
                  </Text>
                  <Text className="text-surface-300 text-xxs mt-0.5">by {o.supplierName}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[#D4A017] text-sm font-bold">
                    PKR {o.totalPKR.toLocaleString()}
                  </Text>
                  <Text style={{ letterSpacing: 0.5 }} className="text-surface-400 text-xxs font-semibold uppercase mt-0.5">
                    {o.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
