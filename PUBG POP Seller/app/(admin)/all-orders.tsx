import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTION } from '@/constants';
import type { Order, OrderStatus } from '@/shared/types';

type FilterKey = 'all' | 'active' | 'completed' | 'disputed';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
  { key: 'disputed', label: 'Disputed' },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: 'text-yellow-400',
  paid:            'text-blue-400',
  in_progress:     'text-primary-400',
  proof_submitted: 'text-purple-400',
  verified:        'text-green-400',
  completed:       'text-green-400',
  disputed:        'text-red-400',
  cancelled:       'text-surface-300',
};

const ACTIVE: OrderStatus[] = ['pending_payment', 'paid', 'in_progress', 'proof_submitted', 'verified'];

export default function AdminAllOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, COLLECTION.ORDERS), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
      } catch (e) {
        console.error('[Admin] Failed to fetch orders:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ACTIVE.includes(o.status);
    if (filter === 'completed') return o.status === 'completed';
    if (filter === 'disputed') return o.status === 'disputed' || o.status === 'cancelled';
    return true;
  });

  const totalCommission = orders
    .filter((o) => o.status === 'completed')
    .reduce((s, o) => s + o.commission, 0);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-purple-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">All Orders</Text>
        <Text className="text-surface-300 text-sm">{orders.length} total</Text>
      </View>

      {/* Commission summary */}
      <View className="mx-4 mt-3 mb-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex-row justify-between">
        <Text className="text-surface-300 text-sm">Total Commission Earned</Text>
        <Text className="text-yellow-400 font-bold">PKR {totalCommission.toLocaleString()}</Text>
      </View>

      {/* Filter tabs */}
      <View className="flex-row gap-2 px-4 py-3">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            className={`rounded-full px-4 py-2 ${filter === f.key ? 'bg-purple-600' : 'bg-surface-100'}`}
          >
            <Text className={`text-xs font-semibold ${filter === f.key ? 'text-white' : 'text-surface-300'}`}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8b5cf6" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-surface-300 text-base">No orders found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-surface-100 rounded-2xl p-4 mb-3"
              onPress={() => router.push(`/orders/${item.id}` as never)}
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-white font-bold">
                  {item.popAmount.toLocaleString()} POP
                </Text>
                <Text className={`text-xs font-semibold capitalize ${STATUS_COLOR[item.status]}`}>
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-surface-300 text-xs">
                  Buyer: <Text className="text-white">{item.buyerName}</Text>
                </Text>
                <Text className="text-surface-300 text-xs">
                  PKR {item.totalPKR.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-surface-300 text-xs">
                  Supplier: <Text className="text-white">{item.supplierName}</Text>
                </Text>
                <Text className="text-yellow-400 text-xs">
                  Commission: PKR {item.commission}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
