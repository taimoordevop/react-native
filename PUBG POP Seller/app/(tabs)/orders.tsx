import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useMyOrders, useAcceptBuyerOrder } from '@/features/orders/hooks/useOrders';
import type { Order, OrderStatus } from '@/shared/types';

type TabKey = 'all' | 'active' | 'completed' | 'disputed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
  { key: 'disputed', label: 'Disputed' },
];

const ACTIVE_STATUSES: OrderStatus[] = ['pending_payment', 'paid', 'in_progress', 'proof_submitted', 'verified', 'payout_submitted'];
const DONE_STATUSES: OrderStatus[] = ['completed'];
const DISPUTED_STATUSES: OrderStatus[] = ['disputed', 'cancelled'];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending_payment:  { label: 'Awaiting Payment', color: 'text-yellow-400', bg: 'rgba(234, 179, 8, 0.12)' },
  paid:             { label: 'Paid — Awaiting Start', color: 'text-blue-400', bg: 'rgba(59, 130, 246, 0.12)' },
  in_progress:      { label: 'In Progress', color: 'text-[#D4A017]', bg: 'rgba(212, 160, 23, 0.12)' },
  proof_submitted:  { label: 'Proof Submitted', color: 'text-purple-400', bg: 'rgba(168, 85, 247, 0.12)' },
  verified:         { label: 'Verified', color: 'text-green-400', bg: 'rgba(34, 197, 94, 0.12)' },
  payout_submitted: { label: 'Payout Proof Uploaded', color: 'text-indigo-400', bg: 'rgba(99, 102, 241, 0.12)' },
  completed:        { label: 'Completed', color: 'text-green-400', bg: 'rgba(34, 197, 94, 0.12)' },
  disputed:         { label: 'Disputed', color: 'text-red-400', bg: 'rgba(239, 68, 68, 0.12)' },
  cancelled:        { label: 'Cancelled', color: 'text-surface-300', bg: 'rgba(255, 255, 255, 0.08)' },
};

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

function OrderCard({
  order,
  role,
  onAccept,
  accepting,
}: {
  order: Order;
  role: 'buyer' | 'supplier';
  onAccept?: () => void;
  accepting?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const counterpartyName = role === 'buyer' ? order.supplierName : order.buyerName;
  const counterpartyLabel = role === 'buyer' ? 'Supplier' : 'Buyer';

  const handleCopyPubgId = async () => {
    await Clipboard.setStringAsync(order.targetPubgId);
    Alert.alert('Copied!', `PUBG ID ${order.targetPubgId} copied to clipboard.`);
  };

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }}
      className="p-4 mb-3 mx-4"
      activeOpacity={0.85}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View style={{ borderRadius: 2 }} className={`px-2 py-0.5 ${cfg.bg}`}>
          <Text style={{ letterSpacing: 0.5 }} className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</Text>
        </View>
        <Text className="text-surface-300 text-xxs uppercase">
          {order.createdAt?.toDate?.()?.toLocaleDateString() ?? '—'}
        </Text>
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold text-base">
          {order.popAmount.toLocaleString()} POP
        </Text>
        <Text className="text-[#D4A017] font-semibold text-sm">
          PKR {order.totalPKR.toLocaleString()}
        </Text>
      </View>

      <View className="flex-row justify-between mb-1">
        <Text className="text-surface-300 text-xs">
          {counterpartyLabel}: <Text className="text-white font-medium">{counterpartyName}</Text>
        </Text>
        <Text className="text-surface-300 text-xxs">
          {order.agreedRatePer10k}/10k
        </Text>
      </View>

      {expanded && (
        <View className="mt-3 pt-3 border-t border-white/5">
          {/* Buyer PUBG ID row with copy */}
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }} className="p-3 mb-3">
            <Text className="text-surface-300 text-xxs uppercase mb-1">Buyer PUBG ID (send POP here):</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-bold text-sm flex-1" selectable>
                {order.targetPubgId}
              </Text>
              <TouchableOpacity
                onPress={handleCopyPubgId}
                style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212, 160, 23, 0.08)', borderRadius: 2 }}
                className="px-3 py-1.5 ml-2"
              >
                <Text className="text-[#D4A017] text-xxs font-bold uppercase">📋 Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Details */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-surface-300 text-xxs uppercase">Amount:</Text>
            <Text className="text-white text-xs font-semibold">{order.popAmount.toLocaleString()} POP</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-surface-300 text-xxs uppercase">Total:</Text>
            <Text className="text-[#D4A017] text-xs font-bold">PKR {order.totalPKR.toLocaleString()}</Text>
          </View>

          {/* Accept button */}
          {role === 'supplier' && order.status === 'pending_payment' && onAccept && (
            <TouchableOpacity
              style={{
                borderWidth: 1.5,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 2,
                paddingVertical: 12,
                alignItems: 'center',
              }}
              onPress={onAccept}
              disabled={accepting}
            >
              <Text className="text-[#22c55e] font-bold text-xs uppercase">
                {accepting ? 'Accepting…' : '✓ Accept Order'}
              </Text>
            </TouchableOpacity>
          )}

          {/* View full detail link */}
          <TouchableOpacity
            onPress={() => router.push(`/orders/${order.id}` as never)}
            className="mt-2 py-2 items-center"
          >
            <Text className="text-[#D4A017] text-xxs font-bold uppercase">View Full Details →</Text>
          </TouchableOpacity>
        </View>
      )}

      {!expanded && (
        <Text className="text-surface-400 text-[10px] uppercase mt-1">▼ tap to {role === 'supplier' && order.status === 'pending_payment' ? 'accept / see details' : 'see details'}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const { user } = useAuth();
  const role = user?.role === 'buyer' ? 'buyer' : 'supplier';
  const { orders, isLoading } = useMyOrders(user?.uid, role);
  const { mutate: acceptOrder, isPending: accepting, variables: acceptingVars } = useAcceptBuyerOrder();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = orders.filter((o) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ACTIVE_STATUSES.includes(o.status);
    if (activeTab === 'completed') return DONE_STATUSES.includes(o.status);
    if (activeTab === 'disputed') return DISPUTED_STATUSES.includes(o.status);
    return true;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleAccept = (order: Order) => {
    Alert.alert(
      'Accept Order',
      `Accept ${order.popAmount.toLocaleString()} POP order from ${order.buyerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () =>
            acceptOrder(
              { orderId: order.id, requestId: order.listingId, popAmount: order.popAmount },
              { onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed to accept') },
            ),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      <TacticalGrid />
      <CornerReticles />

      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center mb-4">
          {user?.role === 'seller' && (
            <TouchableOpacity onPress={() => router.replace('/(seller)/dashboard' as never)} className="mr-3 p-1">
              <Text className="text-[#D4A017] text-base font-bold">← Back</Text>
            </TouchableOpacity>
          )}
          <Text className="text-white text-xl font-bold uppercase flex-1">Order History</Text>
        </View>
        <View className="flex-row gap-2 mb-2">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                borderWidth: 1.5,
                borderColor: activeTab === tab.key ? '#D4A017' : 'rgba(255,255,255,0.08)',
                backgroundColor: activeTab === tab.key ? 'rgba(212,160,23,0.12)' : 'rgba(30,41,59,0.35)',
                borderRadius: 4,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  color: activeTab === tab.key ? '#D4A017' : '#cbd5e1',
                  fontWeight: 'bold',
                  fontSize: 11,
                  letterSpacing: 0.5,
                }}
                className="uppercase"
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A017" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              role={role}
              onAccept={role === 'supplier' ? () => handleAccept(item) : undefined}
              accepting={accepting && acceptingVars?.orderId === item.id}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text className="text-surface-300 text-sm uppercase mb-2">No orders yet</Text>
              <Text className="text-surface-400 text-xs text-center px-8 leading-5">
                {role === 'buyer'
                  ? 'Browse the Marketplace and place an order to get started.'
                  : 'Orders from buyers will appear here.'}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 32, flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}
