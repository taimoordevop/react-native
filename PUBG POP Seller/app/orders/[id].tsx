import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import {
  useOrderLive,
  useUpdateOrderStatus,
  useVerifyAndComplete,
} from '@/features/orders/hooks/useOrders';
import type { OrderStatus } from '@/shared/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending_payment: { label: 'Awaiting Payment', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  paid:            { label: 'Paid — Awaiting Start', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  in_progress:     { label: 'In Progress', color: 'text-primary-400', bg: 'bg-primary-500/20' },
  proof_submitted: { label: 'Proof Submitted', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  verified:        { label: 'Verified', color: 'text-green-400', bg: 'bg-green-500/20' },
  completed:       { label: 'Completed ✓', color: 'text-green-400', bg: 'bg-green-500/20' },
  disputed:        { label: 'Disputed', color: 'text-red-400', bg: 'bg-red-500/20' },
  cancelled:       { label: 'Cancelled', color: 'text-surface-300', bg: 'bg-surface-200' },
};

const STATUS_STEPS: OrderStatus[] = [
  'pending_payment', 'paid', 'in_progress', 'proof_submitted', 'verified', 'completed',
];

function StatusTracker({ current }: { current: OrderStatus }) {
  const idx = STATUS_STEPS.indexOf(current);
  return (
    <View className="bg-surface-100 rounded-2xl p-4 mb-4">
      <Text className="text-white font-semibold mb-3">Order Progress</Text>
      {STATUS_STEPS.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const done = i <= idx && idx >= 0 && current !== 'cancelled' && current !== 'disputed';
        return (
          <View key={s} className="flex-row items-center mb-2">
            <View
              className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                done ? 'bg-primary-500' : 'bg-surface-200'
              }`}
            >
              <Text className={`text-xs font-bold ${done ? 'text-white' : 'text-surface-300'}`}>
                {done ? '✓' : String(i + 1)}
              </Text>
            </View>
            <Text className={`text-sm ${done ? 'text-white' : 'text-surface-300'}`}>
              {cfg.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-surface-200">
      <Text className="text-surface-300 text-sm">{label}</Text>
      <Text className="text-white text-sm font-medium">{value}</Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { order, isLoading } = useOrderLive(id);
  const updateStatus = useUpdateOrderStatus();
  const verifyComplete = useVerifyAndComplete();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#0ea5e9" size="large" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-red-400 text-base text-center mb-4">Order not found.</Text>
        <TouchableOpacity className="bg-surface-100 rounded-xl px-6 py-3" onPress={() => router.back()}>
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isBuyer = user?.uid === order.buyerId;
  const isSupplier = user?.uid === order.supplierId;
  const cfg = STATUS_CONFIG[order.status];
  const supplierNet = order.totalPKR - order.commission;

  const confirmAction = (title: string, msg: string, onConfirm: () => void) => {
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: onConfirm },
    ]);
  };

  const handlePayEscrow = () =>
    confirmAction(
      'Simulate Payment',
      `PKR ${order.totalPKR.toLocaleString()} will be held in escrow. Proceed?`,
      () => updateStatus.mutate({ id: order.id, status: 'paid' }),
    );

  const handleStartSending = () =>
    confirmAction(
      'Start Sending POP',
      `Send ${order.popAmount.toLocaleString()} POP to PUBG ID: ${order.targetPubgId}`,
      () => updateStatus.mutate({ id: order.id, status: 'in_progress' }),
    );

  const handleCancel = () =>
    confirmAction(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      () => updateStatus.mutate({ id: order.id, status: 'cancelled' }),
    );

  const handleDispute = () =>
    confirmAction(
      'Raise Dispute',
      'Raise a dispute with the platform admin?',
      () => updateStatus.mutate({ id: order.id, status: 'disputed' }),
    );

  const handleVerifyRelease = () =>
    confirmAction(
      'Verify & Release',
      `Release PKR ${supplierNet.toLocaleString()} to supplier (after PKR ${order.commission} commission)?`,
      () => verifyComplete.mutate(order.id),
    );

  const isMutating = updateStatus.isPending || verifyComplete.isPending;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">Order Detail</Text>
        <View className={`px-3 py-1 rounded-full ${cfg.bg}`}>
          <Text className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</Text>
        </View>
      </View>

      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Status tracker */}
        {order.status !== 'cancelled' && order.status !== 'disputed' && (
          <StatusTracker current={order.status} />
        )}

        {/* Order summary */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Order Summary</Text>
          <InfoRow label="POP Amount" value={`${order.popAmount.toLocaleString()} POP`} />
          <InfoRow label="Rate / 10k" value={`PKR ${order.agreedRatePer10k}`} />
          <InfoRow label="Total PKR" value={`PKR ${order.totalPKR.toLocaleString()}`} />
          <InfoRow label="Commission" value={`PKR ${order.commission.toLocaleString()}`} />
          <View className="flex-row justify-between pt-2">
            <Text className="text-surface-300 text-sm">Supplier Receives</Text>
            <Text className="text-green-400 text-sm font-bold">
              PKR {supplierNet.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Parties</Text>
          <InfoRow label="Buyer" value={order.buyerName} />
          <InfoRow label="Target PUBG ID" value={order.targetPubgId} />
          <View className="flex-row justify-between pt-2">
            <Text className="text-surface-300 text-sm">Supplier</Text>
            <Text className="text-white text-sm font-medium">{order.supplierName}</Text>
          </View>
        </View>

        {/* Proof videos */}
        {order.proofVideos.length > 0 && (
          <View className="bg-surface-100 rounded-2xl p-4 mb-4">
            <Text className="text-white font-semibold mb-3">
              Proof Submitted ({order.proofVideos.length})
            </Text>
            {order.proofVideos.map((v, i) => (
              <View key={i} className="mb-3 p-3 bg-surface-200 rounded-xl">
                <Text className="text-primary-400 text-sm mb-1" numberOfLines={1}>
                  {v.url}
                </Text>
                {v.notes ? (
                  <Text className="text-surface-300 text-xs">{v.notes}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* ── BUYER ACTIONS ── */}
        {isBuyer && (
          <View className="gap-3">
            {order.status === 'pending_payment' && (
              <TouchableOpacity
                className="bg-primary-500 rounded-2xl py-4 items-center"
                onPress={handlePayEscrow}
                disabled={isMutating}
              >
                {isMutating ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-bold text-base">
                    Pay PKR {order.totalPKR.toLocaleString()} to Escrow
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {order.status === 'proof_submitted' && (
              <TouchableOpacity
                className="bg-green-600 rounded-2xl py-4 items-center"
                onPress={handleVerifyRelease}
                disabled={isMutating}
              >
                {isMutating ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-bold text-base">
                    Verify Proof &amp; Release Payment
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {['pending_payment', 'paid'].includes(order.status) && (
              <TouchableOpacity
                className="bg-red-500/20 border border-red-500/30 rounded-2xl py-4 items-center"
                onPress={handleCancel}
                disabled={isMutating}
              >
                <Text className="text-red-400 font-semibold">Cancel Order</Text>
              </TouchableOpacity>
            )}

            {['in_progress', 'proof_submitted'].includes(order.status) && (
              <TouchableOpacity
                className="bg-orange-500/20 border border-orange-500/30 rounded-2xl py-4 items-center"
                onPress={handleDispute}
                disabled={isMutating}
              >
                <Text className="text-orange-400 font-semibold">Raise Dispute</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── SUPPLIER ACTIONS ── */}
        {isSupplier && (
          <View className="gap-3">
            {order.status === 'paid' && (
              <TouchableOpacity
                className="bg-primary-500 rounded-2xl py-4 items-center"
                onPress={handleStartSending}
                disabled={isMutating}
              >
                {isMutating ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-bold text-base">
                    Start Sending POP
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {order.status === 'in_progress' && (
              <TouchableOpacity
                className="bg-purple-600 rounded-2xl py-4 items-center"
                onPress={() =>
                  router.push({
                    pathname: '/orders/proof-upload',
                    params: { orderId: order.id },
                  } as never)
                }
              >
                <Text className="text-white font-bold text-base">Upload Proof</Text>
              </TouchableOpacity>
            )}

            {order.status === 'paid' && (
              <TouchableOpacity
                className="bg-red-500/20 border border-red-500/30 rounded-2xl py-4 items-center"
                onPress={handleCancel}
                disabled={isMutating}
              >
                <Text className="text-red-400 font-semibold">Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
