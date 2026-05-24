import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import type { Transaction, TransactionType } from '@/shared/types';

const TYPE_CONFIG: Record<TransactionType, { label: string; color: string; icon: string }> = {
  buyer_payment:   { label: 'Buyer Payment',    color: 'text-green-400',  icon: '💰' },
  supplier_payout: { label: 'Supplier Payout',  color: 'text-red-400',    icon: '💸' },
  manual_profit:   { label: 'Manual Deal',       color: 'text-yellow-400', icon: '📝' },
  commission:      { label: 'Commission',        color: 'text-surface-300', icon: '🏦' },
};

function TransactionRow({ txn }: { txn: Transaction }) {
  const cfg = TYPE_CONFIG[txn.type];
  const dateMs =
    typeof txn.date === 'object' && 'seconds' in txn.date
      ? (txn.date as { seconds: number }).seconds * 1000
      : 0;
  const dateStr = dateMs
    ? new Date(dateMs).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
    : '—';

  return (
    <View className="flex-row items-center py-3 border-b border-surface-200">
      <View className="w-9 h-9 rounded-full bg-surface-200 items-center justify-center mr-3">
        <Text className="text-base">{cfg.icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-medium" numberOfLines={1}>
          {txn.description}
        </Text>
        <View className="flex-row items-center gap-2 mt-0.5">
          <Text className={`text-xs ${cfg.color}`}>{cfg.label}</Text>
          <Text className="text-surface-400 text-xs">·</Text>
          <Text className="text-surface-400 text-xs">{dateStr}</Text>
          {txn.isManual && (
            <>
              <Text className="text-surface-400 text-xs">·</Text>
              <Text className="text-yellow-500 text-xs">Manual</Text>
            </>
          )}
        </View>
      </View>
      <View className="items-end ml-2">
        <Text
          className={`text-sm font-bold ${
            txn.profitPKR >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {txn.profitPKR >= 0 ? '+' : ''}PKR {txn.profitPKR.toLocaleString()}
        </Text>
        <Text className="text-surface-400 text-xs">
          {txn.paymentMethod.replace(/_/g, ' ')}
        </Text>
      </View>
    </View>
  );
}

type Period = 'today' | 'week' | 'month' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  week:  'This Week',
  month: 'This Month',
  all:   'All Time',
};

export default function AnalyticsScreen() {
  const { user } = useAuthStore();
  const { data, isLoading, refetch, isRefetching } = useAnalytics(user?.uid);
  const [period, setPeriod] = useState<Period>('week');

  const summary = data?.[period === 'week' ? 'thisWeek' : period === 'month' ? 'thisMonth' : period] ?? {
    totalProfit: 0,
    totalRevenue: 0,
    transactionCount: 0,
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-yellow-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">Analytics</Text>
        <TouchableOpacity
          onPress={() => router.push('/(seller)/log-deal' as never)}
          className="bg-yellow-500 rounded-xl px-3 py-2"
        >
          <Text className="text-white font-bold text-sm">+ Log Deal</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f59e0b" size="large" />
        </View>
      ) : (
        <ScrollView
          /* eslint-disable-next-line react-native/no-inline-styles */
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#f59e0b"
            />
          }
        >
          {/* Top 3 summary cards */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-yellow-500/30">
              <Text className="text-yellow-400 text-xs mb-1">Today</Text>
              <Text className="text-white text-xl font-bold">
                PKR {(data?.today.totalProfit ?? 0).toLocaleString()}
              </Text>
              <Text className="text-surface-400 text-xs mt-1">
                {data?.today.transactionCount ?? 0} deals
              </Text>
            </View>
            <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-primary-500/30">
              <Text className="text-primary-400 text-xs mb-1">This Week</Text>
              <Text className="text-white text-xl font-bold">
                PKR {(data?.thisWeek.totalProfit ?? 0).toLocaleString()}
              </Text>
              <Text className="text-surface-400 text-xs mt-1">
                {data?.thisWeek.transactionCount ?? 0} deals
              </Text>
            </View>
            <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-green-500/30">
              <Text className="text-green-400 text-xs mb-1">All Time</Text>
              <Text className="text-white text-xl font-bold">
                PKR {(data?.all.totalProfit ?? 0).toLocaleString()}
              </Text>
              <Text className="text-surface-400 text-xs mt-1">
                {data?.all.transactionCount ?? 0} deals
              </Text>
            </View>
          </View>

          {/* Period selector + expanded card */}
          <View className="bg-surface-100 rounded-2xl p-4 mb-4">
            <View className="flex-row gap-2 mb-4">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  className={`flex-1 py-2 rounded-xl items-center ${
                    period === p ? 'bg-yellow-500' : 'bg-surface-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      period === p ? 'text-white' : 'text-surface-300'
                    }`}
                  >
                    {PERIOD_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-green-400 text-2xl font-bold">
                  PKR {summary.totalProfit.toLocaleString()}
                </Text>
                <Text className="text-surface-400 text-xs mt-1">Net Profit</Text>
              </View>
              <View className="w-px bg-surface-200" />
              <View className="items-center">
                <Text className="text-white text-2xl font-bold">
                  PKR {summary.totalRevenue.toLocaleString()}
                </Text>
                <Text className="text-surface-400 text-xs mt-1">Revenue</Text>
              </View>
              <View className="w-px bg-surface-200" />
              <View className="items-center">
                <Text className="text-primary-400 text-2xl font-bold">
                  {summary.transactionCount}
                </Text>
                <Text className="text-surface-400 text-xs mt-1">Deals</Text>
              </View>
            </View>
          </View>

          {/* Recent transactions */}
          <View className="bg-surface-100 rounded-2xl px-4 pt-4 pb-2 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white font-semibold">Recent Transactions</Text>
              <Text className="text-surface-400 text-xs">
                {data?.recent.length ?? 0} shown
              </Text>
            </View>
            {(data?.recent.length ?? 0) === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-3xl mb-2">📊</Text>
                <Text className="text-surface-300 text-sm text-center">
                  No transactions yet.{'\n'}Log a deal or complete an order.
                </Text>
              </View>
            ) : (
              data?.recent.map((txn) => (
                <TransactionRow key={txn.id} txn={txn} />
              ))
            )}
          </View>

          {/* Log deal CTA */}
          <TouchableOpacity
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl py-4 items-center"
            onPress={() => router.push('/(seller)/log-deal' as never)}
          >
            <Text className="text-yellow-400 font-semibold">
              📝 Log a WhatsApp / Offline Deal
            </Text>
            <Text className="text-surface-400 text-xs mt-1">
              Track deals made outside the app
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
