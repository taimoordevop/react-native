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
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      <TacticalGrid />
      <CornerReticles />

      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-[#D4A017] text-base font-bold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold flex-1 uppercase">Disputes</Text>
        <Text className="text-surface-300 text-xs uppercase font-medium">{orders.length} open</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A017" size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text className="text-[#D4A017] text-3xl mb-2">✓</Text>
              <Text className="text-surface-300 text-xs font-bold uppercase">No open disputes</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-3">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-white font-bold text-base">
                    {item.popAmount.toLocaleString()} POP
                  </Text>
                  <Text className="text-[#D4A017] text-xs font-semibold mt-0.5">
                    PKR {item.totalPKR.toLocaleString()}
                  </Text>
                </View>
                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', borderRadius: 2 }} className="px-3 py-1">
                  <Text className="text-red-400 text-[10px] font-bold uppercase">Disputed</Text>
                </View>
              </View>

              <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }} className="p-3 mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-surface-300 text-xxs uppercase">Buyer</Text>
                  <Text className="text-white text-xs font-semibold">{item.buyerName}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-surface-300 text-xxs uppercase">Supplier</Text>
                  <Text className="text-white text-xs font-semibold">{item.supplierName}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-surface-300 text-xxs uppercase">PUBG ID (target)</Text>
                  <Text className="text-white text-xs font-semibold">{item.targetPubgId}</Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}
                  className="flex-1 py-3 items-center"
                  onPress={() => router.push(`/orders/${item.id}` as never)}
                >
                  <Text className="text-white text-xs font-bold uppercase">View Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                  className="flex-1 py-3 items-center"
                  onPress={() => handleResolve(item)}
                >
                  <Text className="text-[#D4A017] text-xs font-bold uppercase">Resolve</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
