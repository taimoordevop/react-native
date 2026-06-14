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
  useArchiveRequest,
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

function RequestCard({
  request,
  onCancel,
  onArchive,
}: {
  request: SellerRequest;
  onCancel: () => void;
  onArchive: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.2)', borderRadius: 4 }} className="p-4 mb-3">
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
            <View className={`px-2 py-0.5 rounded border ${STATUS_BG[request.status]}`}>
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
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} className="rounded-full h-1.5 mb-2 overflow-hidden">
          <View
            style={{
              backgroundColor: '#D4A017',
              width: `${Math.max(0, Math.min(100, (1 - request.remainingAmount / request.totalPopAmount) * 100))}%`,
            }}
            className="h-full rounded-full"
          />
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-surface-400 text-[10px]">
            Created: {request.createdAt?.toDate?.()?.toLocaleDateString() ?? 'Recent'}
          </Text>
          <Text className="text-[#D4A017] text-xs font-semibold">
            {expanded ? '▲ Hide Details' : '▼ View Details'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Details */}
      {expanded && (
        <View style={{ borderTopColor: 'rgba(255,255,255,0.06)' }} className="mt-3 pt-3 border-t">
          {request.notes && (
            <View style={{ backgroundColor: 'rgba(30,41,59,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="mb-2 p-2.5">
              <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-[10px] font-bold mb-0.5 uppercase">Notes:</Text>
              <Text className="text-white text-xs">{request.notes}</Text>
            </View>
          )}

          {/* Cancel or Remove button */}
          {['open', 'partially_booked', 'fully_booked', 'in_progress'].includes(request.status) ? (
            <TouchableOpacity
              onPress={onCancel}
              style={{
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                borderRadius: 2,
                paddingVertical: 10,
                alignItems: 'center',
              }}
              className="mt-2"
            >
              <Text style={{ letterSpacing: 1 }} className="text-red-400 text-xs font-bold uppercase">Cancel / Close Request</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onArchive}
              style={{
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                borderRadius: 2,
                paddingVertical: 10,
                alignItems: 'center',
              }}
              className="mt-2"
            >
              <Text style={{ letterSpacing: 1 }} className="text-red-400 text-xs font-bold uppercase">Remove from List</Text>
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
  const { mutate: archiveRequest } = useArchiveRequest();
  const [filter, setFilter] = useState<FilterKey>('active');

  const filtered = requests.filter((r) => {
    if (r.archived === true) return false;
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

  const handleArchive = (id: string) => {
    Alert.alert('Remove Request', 'Are you sure you want to remove this request from your view? It will be archived and hidden.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => archiveRequest(id),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      {/* Background Overlay */}
      <TacticalGrid />

      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <TouchableOpacity onPress={() => router.replace('/(seller)/dashboard' as never)} className="mr-3 p-1">
          <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-sm font-bold uppercase">← BACK</Text>
        </TouchableOpacity>
        <Text style={{ letterSpacing: 1 }} className="text-white text-base font-bold flex-1 uppercase">BUYER REQUESTS</Text>
        <TouchableOpacity
          style={{
            borderWidth: 1.5,
            borderColor: '#D4A017',
            borderRadius: 2,
            backgroundColor: 'rgba(212, 160, 23, 0.15)',
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
          onPress={() => router.push('/(seller)/post-request' as never)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10, letterSpacing: 1 }} className="uppercase">+ New Request</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={{ borderBottomColor: 'rgba(255,255,255,0.06)' }} className="flex-row gap-2 px-4 py-3 border-b bg-[#090d16]">
        {([
          { key: 'active' as FilterKey, label: 'Active' },
          { key: 'completed' as FilterKey, label: 'Completed' },
          { key: 'all' as FilterKey, label: 'All Requests' },
        ]).map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              borderWidth: 1,
              borderColor: filter === f.key ? '#D4A017' : 'rgba(255,255,255,0.08)',
              backgroundColor: filter === f.key ? 'rgba(212, 160, 23, 0.15)' : 'rgba(30,41,59,0.4)',
              borderRadius: 4,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{
              color: filter === f.key ? '#D4A017' : '#cbd5e1',
              fontSize: 11,
              fontWeight: 'bold',
              letterSpacing: 1,
            }} className="uppercase">
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A017" size="large" />
          <Text style={{ letterSpacing: 1 }} className="text-surface-400 text-xxs mt-2 uppercase">Loading buyer requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 10, paddingBottom: 40, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20 px-8">
              <Text className="text-4xl mb-3">📭</Text>
              <Text style={{ letterSpacing: 1.5 }} className="text-white text-base font-bold mb-2 uppercase">No Requests Found</Text>
              <Text className="text-surface-400 text-xs text-center leading-relaxed">
                Create a Buyer Request to offer popularity packages directly to prospective buyers in the app.
              </Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1.5,
                  borderColor: '#D4A017',
                  borderRadius: 2,
                  backgroundColor: 'rgba(212, 160, 23, 0.15)',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  marginTop: 24,
                }}
                onPress={() => router.push('/(seller)/post-request' as never)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1.5 }} className="uppercase">Post Buyer Request</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              onCancel={() => handleCancel(item.id)}
              onArchive={() => handleArchive(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
