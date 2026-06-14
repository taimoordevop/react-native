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
  seller_profit:   { label: 'Seller Profit',    color: 'text-primary-400', icon: '✨' },
  manual:          { label: 'Manual Deal',       color: 'text-yellow-400', icon: '📝' },
  manual_profit:   { label: 'Manual Deal',       color: 'text-yellow-400', icon: '📝' },
  commission:      { label: 'Commission',        color: 'text-surface-300', icon: '🏦' },
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

function TransactionRow({ txn }: { txn: Transaction }) {
  const cfg = TYPE_CONFIG[txn.type] || { label: txn.type, color: 'text-white', icon: '⚡' };
  const dateMs =
    typeof txn.date === 'object' && 'seconds' in txn.date
      ? (txn.date as { seconds: number }).seconds * 1000
      : 0;
  const dateStr = dateMs
    ? new Date(dateMs).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
    : '—';

  return (
    <View style={{ borderBottomColor: 'rgba(255,255,255,0.06)' }} className="py-3 border-b">
      <View className="flex-row items-center">
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 18 }} className="w-9 h-9 items-center justify-center mr-3">
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
                <Text className="text-yellow-500 text-xs font-medium">Manual</Text>
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
          <Text className="text-surface-400 text-xs capitalize">
            {txn.paymentMethod ? txn.paymentMethod.replace(/_/g, ' ') : '—'}
          </Text>
        </View>
      </View>

      {/* Per-Order Rate Breakdown */}
      {txn.popAmount !== undefined && (txn.buyerRate !== undefined || txn.supplierRate !== undefined) && (
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.45)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="mt-2 p-2.5 flex-row justify-between items-center">
          <Text className="text-surface-400 text-[10px] font-medium">
            POP: <Text className="text-white">{txn.popAmount.toLocaleString()}</Text>
          </Text>
          {txn.buyerRate !== undefined && (
            <Text className="text-surface-400 text-[10px] font-medium">
              Buyer Rate: <Text className="text-green-400">PKR {txn.buyerRate}/10k</Text>
            </Text>
          )}
          {txn.supplierRate !== undefined && (
            <Text className="text-surface-400 text-[10px] font-medium">
              Supplier Rate: <Text className="text-red-400">PKR {txn.supplierRate}/10k</Text>
            </Text>
          )}
        </View>
      )}
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
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      {/* Background Overlay */}
      <TacticalGrid />

      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-sm font-bold uppercase">← BACK</Text>
        </TouchableOpacity>
        <Text style={{ letterSpacing: 1 }} className="text-white text-base font-bold flex-1 uppercase">ANALYTICS</Text>
        <TouchableOpacity
          style={{
            borderWidth: 1.5,
            borderColor: '#D4A017',
            borderRadius: 2,
            backgroundColor: 'rgba(212, 160, 23, 0.15)',
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
          onPress={() => router.push('/(seller)/log-deal' as never)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10, letterSpacing: 1 }} className="uppercase">+ Log Deal</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A017" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#D4A017"
            />
          }
        >
          {/* Top 4 summary cards */}
          <View className="flex-row gap-3 mb-3">
            <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.3)', borderRadius: 4 }} className="flex-1 p-4">
              <Text style={{ letterSpacing: 0.5 }} className="text-[#D4A017] text-xxs font-bold uppercase mb-1">Today's Profit</Text>
              <Text className="text-white text-lg font-bold">
                PKR {(data?.today.totalProfit ?? 0).toLocaleString()}
              </Text>
              <Text className="text-surface-400 text-[9px] mt-1 font-medium uppercase">
                {data?.today.transactionCount ?? 0} deals
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', borderRadius: 4 }} className="flex-1 p-4">
              <Text style={{ letterSpacing: 0.5 }} className="text-blue-400 text-xxs font-bold uppercase mb-1">This Week</Text>
              <Text className="text-white text-lg font-bold">
                PKR {(data?.thisWeek.totalProfit ?? 0).toLocaleString()}
              </Text>
              <Text className="text-surface-400 text-[9px] mt-1 font-medium uppercase">
                {data?.thisWeek.transactionCount ?? 0} deals
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 4 }} className="flex-1 p-4">
              <Text style={{ letterSpacing: 0.5 }} className="text-green-400 text-xxs font-bold uppercase mb-1">This Month</Text>
              <Text className="text-white text-lg font-bold">
                PKR {(data?.thisMonth.totalProfit ?? 0).toLocaleString()}
              </Text>
              <Text className="text-surface-400 text-[9px] mt-1 font-medium uppercase">
                {data?.thisMonth.transactionCount ?? 0} deals
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)', borderRadius: 4 }} className="flex-1 p-4">
              <Text style={{ letterSpacing: 0.5 }} className="text-purple-400 text-xxs font-bold uppercase mb-1">Lifetime Profit</Text>
              <Text className="text-white text-lg font-bold">
                PKR {(data?.all.totalProfit ?? 0).toLocaleString()}
              </Text>
              <Text className="text-surface-400 text-[9px] mt-1 font-medium uppercase">
                {data?.all.transactionCount ?? 0} deals
              </Text>
            </View>
          </View>

          {/* Period selector + expanded card */}
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4 mb-4">
            <View className="flex-row gap-2 mb-4">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={{
                    borderWidth: 1,
                    borderColor: period === p ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: period === p ? 'rgba(212, 160, 23, 0.15)' : 'rgba(30,41,59,0.4)',
                    borderRadius: 4,
                    paddingVertical: 10,
                  }}
                  className="flex-1 items-center"
                >
                  <Text
                    style={{
                      color: period === p ? '#D4A017' : '#cbd5e1',
                      fontSize: 10,
                      fontWeight: 'bold',
                      letterSpacing: 0.5,
                    }}
                    className="uppercase"
                  >
                    {PERIOD_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-green-400 text-xl font-bold">
                  PKR {summary.totalProfit.toLocaleString()}
                </Text>
                <Text className="text-surface-400 text-[10px] font-bold uppercase mt-1">Net Profit</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} className="w-px" />
              <View className="items-center">
                <Text className="text-white text-xl font-bold">
                  PKR {summary.totalRevenue.toLocaleString()}
                </Text>
                <Text className="text-surface-400 text-[10px] font-bold uppercase mt-1">Revenue</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} className="w-px" />
              <View className="items-center">
                <Text className="text-blue-400 text-xl font-bold">
                  {summary.transactionCount}
                </Text>
                <Text className="text-surface-400 text-[10px] font-bold uppercase mt-1">Deals</Text>
              </View>
            </View>
          </View>

          {/* Recent transactions */}
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="px-4 pt-4 pb-2 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white font-bold uppercase text-xs">Recent Transactions</Text>
              <Text className="text-surface-400 text-xxs uppercase">
                {data?.recent.length ?? 0} shown
              </Text>
            </View>
            {(data?.recent.length ?? 0) === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-3xl mb-2">📊</Text>
                <Text className="text-surface-300 text-xs text-center leading-relaxed">
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
            style={{
              backgroundColor: 'rgba(212, 160, 23, 0.08)',
              borderWidth: 1.5,
              borderColor: 'rgba(212, 160, 23, 0.3)',
              borderRadius: 4,
              paddingVertical: 16,
              alignItems: 'center',
            }}
            onPress={() => router.push('/(seller)/log-deal' as never)}
          >
            <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] font-bold uppercase text-xs">
              📝 Log a WhatsApp / Offline Deal
            </Text>
            <Text className="text-surface-400 text-[10px] uppercase mt-1">
              Track deals made outside the app
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
