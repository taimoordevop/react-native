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
  pending_payment:  'text-yellow-400',
  paid:             'text-blue-400',
  in_progress:      'text-[#D4A017]',
  proof_submitted:  'text-purple-400',
  verified:         'text-green-400',
  payout_submitted: 'text-indigo-400',
  completed:        'text-green-400',
  disputed:         'text-red-400',
  cancelled:        'text-surface-300',
};

const ACTIVE: OrderStatus[] = ['pending_payment', 'paid', 'in_progress', 'proof_submitted', 'verified', 'payout_submitted'];

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
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      <TacticalGrid />
      <CornerReticles />

      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-[#D4A017] text-base font-bold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold flex-1 uppercase">All Orders</Text>
        <Text className="text-surface-300 text-xs uppercase font-medium">{orders.length} total</Text>
      </View>

      {/* Commission summary */}
      <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)', borderWidth: 1.5, borderColor: 'rgba(212, 160, 23, 0.35)', borderRadius: 4 }} className="mx-4 mt-4 mb-2 px-4 py-3 flex-row justify-between">
        <Text className="text-surface-300 text-xs uppercase font-bold">Total Commission Earned</Text>
        <Text className="text-[#D4A017] text-xs font-bold uppercase">PKR {totalCommission.toLocaleString()}</Text>
      </View>

      {/* Filter tabs */}
      <View className="flex-row gap-2 px-4 py-3">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              borderWidth: 1.5,
              borderColor: filter === f.key ? '#D4A017' : 'rgba(255,255,255,0.08)',
              backgroundColor: filter === f.key ? 'rgba(212,160,23,0.12)' : 'rgba(30,41,59,0.35)',
              borderRadius: 4,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                color: filter === f.key ? '#D4A017' : '#cbd5e1',
                fontWeight: 'bold',
                fontSize: 11,
                letterSpacing: 0.5,
              }}
              className="uppercase"
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A017" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-surface-300 text-xs uppercase font-bold">No orders found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }}
              className="p-4 mb-3"
              onPress={() => router.push(`/orders/${item.id}` as never)}
            >
              <View className="flex-row justify-between items-start mb-2.5">
                <Text className="text-white font-bold text-sm">
                  {item.popAmount.toLocaleString()} POP
                </Text>
                <Text style={{ letterSpacing: 0.5 }} className={`text-[10px] font-bold uppercase ${STATUS_COLOR[item.status]}`}>
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-surface-300 text-xs">
                  Buyer: <Text className="text-white font-medium">{item.buyerName}</Text>
                </Text>
                <Text className="text-white text-xs font-semibold">
                  PKR {item.totalPKR.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-surface-300 text-xs">
                  Supplier: <Text className="text-white font-medium">{item.supplierName}</Text>
                </Text>
                <Text className="text-[#D4A017] text-xs font-bold">
                  Comm: PKR {item.commission}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
