import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import {
  useSellerRequests,
  useUpdateRequestStatus,
} from '@/features/requests/hooks/useRequests';
import type { SellerRequest } from '@/shared/types';

type FilterKey = 'active' | 'completed' | 'all';

const STATUS_COLOR: Record<string, string> = {
  open:              'text-yellow-400',
  partially_booked:  'text-orange-400',
  fully_booked:      'text-blue-400',
  in_progress:       'text-primary-400',
  completed:         'text-green-400',
  cancelled:         'text-surface-300',
};

const STATUS_BG: Record<string, string> = {
  open:              'bg-yellow-500/10 border-yellow-500/20',
  partially_booked:  'bg-orange-500/10 border-orange-500/20',
  fully_booked:      'bg-blue-500/10 border-blue-500/20',
  in_progress:       'bg-primary-500/10 border-primary-500/20',
  completed:         'bg-green-500/10 border-green-500/20',
  cancelled:         'bg-surface-200/50 border-surface-300/30',
};

function RequestCard({
  request,
  onCancel,
}: {
  request: SellerRequest;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="bg-surface-100 rounded-2xl p-4 mb-3 border border-surface-200">
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.95}>
        {/* Header row */}
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="text-white font-bold text-lg">
              {request.totalPopAmount.toLocaleString()} POP
            </Text>
            <Text className="text-surface-300 text-xs">
              Rate: PKR {request.ratePer10k}/10k
            </Text>
          </View>
          <View className="items-end gap-1">
            <View className={`px-2 py-0.5 rounded-full border ${STATUS_BG[request.status]}`}>
              <Text className={`text-[10px] font-bold capitalize ${STATUS_COLOR[request.status]}`}>
                {request.status.replace(/_/g, ' ')}
              </Text>
            </View>
            <Text className="text-surface-400 text-xs mt-1">
              {request.remainingAmount.toLocaleString()} left
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View className="bg-surface-200 rounded-full h-1.5 mb-2 overflow-hidden">
          <View
            className="bg-yellow-500 h-full rounded-full"
            style={{
              width: `${Math.max(0, Math.min(100, (1 - request.remainingAmount / request.totalPopAmount) * 100))}%`,
            }}
          />
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-surface-400 text-[10px]">
            Created: {request.createdAt?.toDate?.()?.toLocaleDateString() ?? 'Recent'}
          </Text>
          <Text className="text-yellow-400 text-xs font-semibold">
            {expanded ? '▲ Hide Details' : '▼ View Details'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Details */}
      {expanded && (
        <View className="mt-3 pt-3 border-t border-surface-200/50">
          {request.notes && (
            <View className="mb-2 bg-surface-200/40 p-2.5 rounded-xl border border-surface-200">
              <Text className="text-surface-300 text-xs font-bold mb-0.5">Notes:</Text>
              <Text className="text-white text-xs">{request.notes}</Text>
            </View>
          )}

          {/* Cancel button */}
          {['open', 'partially_booked'].includes(request.status) && (
            <TouchableOpacity
              onPress={onCancel}
              className="mt-2 py-2.5 items-center rounded-xl border border-red-500/30 bg-red-500/5"
            >
              <Text className="text-red-400 text-xs font-semibold">Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function SellerBuyerRequestsScreen() {
  const { user } = useAuthStore();
  const { requests, isLoading } = useSellerRequests(user?.uid);
  const { mutate: updateRequest } = useUpdateRequestStatus();
  const [filter, setFilter] = useState<FilterKey>('active');

  const filtered = requests.filter((r) => {
    if (r.targetAudience !== 'buyer') return false;
    if (filter === 'active') return ['open', 'partially_booked', 'fully_booked', 'in_progress'].includes(r.status);
    if (filter === 'completed') return ['completed', 'cancelled'].includes(r.status);
    return true;
  });

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel this Buyer Request? Buyers will no longer be able to buy POP from it.', [
      { text: 'Keep Request', style: 'cancel' },
      {
        text: 'Cancel Request',
        style: 'destructive',
        onPress: () => updateRequest({ id, status: 'cancelled' }),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.replace('/(seller)/dashboard' as never)} className="mr-3 p-2 bg-surface-100 rounded-lg">
          <Text className="text-yellow-500 font-bold text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">Buyer Requests</Text>
        <TouchableOpacity
          className="bg-yellow-500 rounded-xl px-3.5 py-2"
          onPress={() => router.push('/(seller)/post-request' as never)}
        >
          <Text className="text-slate-950 text-xs font-black">+ New Request</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View className="flex-row gap-2 px-4 py-3 border-b border-surface-200/40">
        {([
          { key: 'active' as FilterKey, label: 'Active' },
          { key: 'completed' as FilterKey, label: 'Completed' },
          { key: 'all' as FilterKey, label: 'All Requests' },
        ]).map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            className={`rounded-full px-4 py-2 border ${
              filter === f.key ? 'bg-yellow-500 border-yellow-400' : 'bg-surface-100 border-surface-200'
            }`}
          >
            <Text className={`text-xs font-bold ${filter === f.key ? 'text-slate-950' : 'text-surface-300'}`}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f59e0b" size="large" />
          <Text className="text-surface-400 text-xs mt-2">Loading buyer requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 10, paddingBottom: 40, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20 px-8">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-white text-base font-bold mb-2">No buyer requests found</Text>
              <Text className="text-surface-400 text-sm text-center">
                Create a Buyer Request to offer popularity packages directly to prospective buyers in the app.
              </Text>
              <TouchableOpacity
                className="bg-yellow-500 rounded-xl px-6 py-3 mt-6"
                onPress={() => router.push('/(seller)/post-request' as never)}
              >
                <Text className="text-slate-950 font-bold">Post Buyer Request</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              onCancel={() => handleCancel(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
