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

const ACTIVE_STATUSES: OrderStatus[] = ['pending_payment', 'paid', 'in_progress', 'proof_submitted', 'verified'];
const DONE_STATUSES: OrderStatus[] = ['completed'];
const DISPUTED_STATUSES: OrderStatus[] = ['disputed', 'cancelled'];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending_payment: { label: 'Awaiting Payment', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  paid:            { label: 'Paid — Awaiting Start', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  in_progress:     { label: 'In Progress', color: 'text-primary-400', bg: 'bg-primary-500/20' },
  proof_submitted: { label: 'Proof Submitted', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  verified:        { label: 'Verified', color: 'text-green-400', bg: 'bg-green-500/20' },
  completed:       { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/20' },
  disputed:        { label: 'Disputed', color: 'text-red-400', bg: 'bg-red-500/20' },
  cancelled:       { label: 'Cancelled', color: 'text-surface-300', bg: 'bg-surface-200' },
};

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
      className="bg-surface-100 rounded-2xl p-4 mb-3 mx-4"
      activeOpacity={0.85}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className={`px-3 py-1 rounded-full ${cfg.bg}`}>
          <Text className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</Text>
        </View>
        <Text className="text-surface-300 text-xs">
          {order.createdAt?.toDate?.()?.toLocaleDateString() ?? '—'}
        </Text>
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold text-lg">
          {order.popAmount.toLocaleString()} POP
        </Text>
        <Text className="text-primary-400 font-semibold">
          PKR {order.totalPKR.toLocaleString()}
        </Text>
      </View>

      <View className="flex-row justify-between mb-1">
        <Text className="text-surface-300 text-sm">
          {counterpartyLabel}: <Text className="text-white">{counterpartyName}</Text>
        </Text>
        <Text className="text-surface-300 text-xs">
          {order.agreedRatePer10k}/10k
        </Text>
      </View>

      {/* Expanded detail — seller sees buyer PUBG ID + Accept button */}
      {expanded && (
        <View className="mt-3 pt-3 border-t border-surface-200">

          {/* Buyer PUBG ID row with copy */}
          <View className="bg-surface-200 rounded-xl p-3 mb-3">
            <Text className="text-surface-300 text-xs mb-1">Buyer PUBG ID (send POP here):</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-bold text-base flex-1" selectable>
                {order.targetPubgId}
              </Text>
              <TouchableOpacity
                onPress={handleCopyPubgId}
                className="bg-primary-500/20 border border-primary-500/40 rounded-lg px-3 py-1.5 ml-2"
              >
                <Text className="text-primary-400 text-xs font-semibold">📋 Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Order details */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-surface-300 text-xs">Amount:</Text>
            <Text className="text-white text-xs">{order.popAmount.toLocaleString()} POP</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-surface-300 text-xs">Total:</Text>
            <Text className="text-primary-400 text-xs font-semibold">PKR {order.totalPKR.toLocaleString()}</Text>
          </View>

          {/* Accept button — only for seller role on pending orders */}
          {role === 'supplier' && order.status === 'pending_payment' && onAccept && (
            <TouchableOpacity
              className={`rounded-xl py-3 items-center ${
                accepting ? 'bg-surface-200' : 'bg-green-600'
              }`}
              onPress={onAccept}
              disabled={accepting}
            >
              <Text className="text-white font-bold">
                {accepting ? 'Accepting…' : '✓ Accept Order'}
              </Text>
            </TouchableOpacity>
          )}

          {/* View full detail link */}
          <TouchableOpacity
            onPress={() => router.push(`/orders/${order.id}` as never)}
            className="mt-2 py-2 items-center"
          >
            <Text className="text-primary-400 text-xs">View Full Details →</Text>
          </TouchableOpacity>
        </View>
      )}

      {!expanded && (
        <Text className="text-surface-400 text-xs mt-1">▼ tap to {role === 'supplier' && order.status === 'pending_payment' ? 'accept / see details' : 'see details'}</Text>
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
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold mb-4">Orders</Text>
        <View className="flex-row gap-2 mb-2">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 ${
                activeTab === tab.key ? 'bg-primary-500' : 'bg-surface-100'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeTab === tab.key ? 'text-white' : 'text-surface-300'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0ea5e9" size="large" />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text className="text-surface-300 text-base mb-2">No orders yet</Text>
              <Text className="text-surface-400 text-sm text-center px-8">
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
