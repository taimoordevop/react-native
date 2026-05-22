import { router } from 'expo-router';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useMyOrders } from '@/features/orders/hooks/useOrders';

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
    <SafeAreaView className="flex-1 bg-surface">
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-surface-300 text-sm">Welcome back,</Text>
          <Text className="text-white text-2xl font-bold">
            {user?.displayName ?? 'Buyer'}
          </Text>
          <View className="self-start mt-1 px-3 py-1 rounded-full bg-blue-500/20">
            <Text className="text-blue-400 text-xs font-semibold">Buyer</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-surface-200">
            <Text className="text-white text-3xl font-bold">{orders.length}</Text>
            <Text className="text-surface-300 text-xs mt-1">Orders Placed</Text>
          </View>
          <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-surface-200">
            <Text className="text-primary-400 text-3xl font-bold">{activeOrders.length}</Text>
            <Text className="text-surface-300 text-xs mt-1">Active</Text>
          </View>
          <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-surface-200">
            <Text className="text-green-400 text-2xl font-bold">
              {popReceivedThisWeek >= 1000
                ? `${(popReceivedThisWeek / 1000).toFixed(0)}k`
                : String(popReceivedThisWeek)}
            </Text>
            <Text className="text-surface-300 text-xs mt-1">POP / Week</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Quick Actions</Text>

          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-4 px-4 mb-3 flex-row items-center"
            onPress={() => router.push('/(buyer)/marketplace' as never)}
          >
            <Text className="text-white font-bold flex-1">Browse Marketplace</Text>
            <Text className="text-white/60">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface-200 rounded-xl py-4 px-4 flex-row items-center"
            onPress={() => router.push('/(buyer)/orders' as never)}
          >
            <Text className="text-white font-medium flex-1">My Active Orders</Text>
            {activeOrders.length > 0 && (
              <View className="bg-primary-500 rounded-full w-6 h-6 items-center justify-center mr-2">
                <Text className="text-white text-xs font-bold">{activeOrders.length}</Text>
              </View>
            )}
            <Text className="text-surface-300">›</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <View className="bg-surface-100 rounded-2xl p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-semibold">Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/(buyer)/orders' as never)}>
              <Text className="text-primary-400 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {orders.slice(0, 3).length === 0 ? (
            <Text className="text-surface-300 text-sm text-center py-4">
              No orders yet — browse the marketplace to get started.
            </Text>
          ) : (
            orders.slice(0, 3).map((o) => (
              <TouchableOpacity
                key={o.id}
                className="flex-row justify-between items-center py-3 border-b border-surface-200 last:border-0"
                onPress={() => router.push(`/orders/${o.id}` as never)}
              >
                <View>
                  <Text className="text-white text-sm font-medium">
                    {o.popAmount.toLocaleString()} POP
                  </Text>
                  <Text className="text-surface-300 text-xs">{o.supplierName}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-primary-400 text-sm font-semibold">
                    PKR {o.totalPKR.toLocaleString()}
                  </Text>
                  <Text className="text-surface-300 text-xs capitalize">
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
