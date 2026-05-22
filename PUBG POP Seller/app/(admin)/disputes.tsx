import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTION } from '@/constants';
import { orderService } from '@/features/orders/services/orderService';
import type { Order } from '@/shared/types';

export default function AdminDisputesScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputed = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, COLLECTION.ORDERS),
        where('status', '==', 'disputed'),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
    } catch (e) {
      console.error('[Admin] Failed to fetch disputes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputed(); }, []);

  const handleResolve = (order: Order) => {
    Alert.alert(
      'Resolve Dispute',
      `How would you like to resolve Order ${order.id.slice(0, 8)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Completed',
          onPress: async () => {
            try {
              await orderService.updateStatus(order.id, 'completed');
              fetchDisputed();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
            }
          },
        },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderService.updateStatus(order.id, 'cancelled');
              fetchDisputed();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-purple-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">Disputes</Text>
        <Text className="text-surface-300 text-sm">{orders.length} open</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8b5cf6" size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text className="text-green-400 text-2xl mb-2">✓</Text>
              <Text className="text-surface-300 text-base">No open disputes</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-surface-100 rounded-2xl p-4 mb-3">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-white font-bold text-base">
                    {item.popAmount.toLocaleString()} POP
                  </Text>
                  <Text className="text-surface-300 text-xs mt-0.5">
                    PKR {item.totalPKR.toLocaleString()}
                  </Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-red-500/20">
                  <Text className="text-red-400 text-xs font-semibold">Disputed</Text>
                </View>
              </View>

              <View className="bg-surface-200 rounded-xl p-3 mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-surface-300 text-xs">Buyer</Text>
                  <Text className="text-white text-xs">{item.buyerName}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-surface-300 text-xs">Supplier</Text>
                  <Text className="text-white text-xs">{item.supplierName}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-surface-300 text-xs">PUBG ID (target)</Text>
                  <Text className="text-white text-xs">{item.targetPubgId}</Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-surface-200 rounded-xl py-3 items-center"
                  onPress={() => router.push(`/orders/${item.id}` as never)}
                >
                  <Text className="text-white text-sm font-medium">View Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-purple-600 rounded-xl py-3 items-center"
                  onPress={() => handleResolve(item)}
                >
                  <Text className="text-white text-sm font-bold">Resolve</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
