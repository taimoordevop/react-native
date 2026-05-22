import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import {
  useSellerRequests,
  useUpdateRequestStatus,
  useRequestBookings,
  useUpdateBookingStatus,
} from '@/features/requests/hooks/useRequests';
import type { Booking, BookingStatus, SellerRequest } from '@/shared/types';

type FilterKey = 'active' | 'completed' | 'all';

const STATUS_COLOR: Record<string, string> = {
  open:              'text-yellow-400',
  partially_booked:  'text-orange-400',
  fully_booked:      'text-blue-400',
  in_progress:       'text-primary-400',
  completed:         'text-green-400',
  cancelled:         'text-surface-300',
};

const BOOKING_STATUS_COLOR: Record<BookingStatus, { text: string; bg: string }> = {
  pending:         { text: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  accepted:        { text: 'text-blue-400',   bg: 'bg-blue-500/20' },
  rejected:        { text: 'text-red-400',    bg: 'bg-red-500/20' },
  in_progress:     { text: 'text-primary-400', bg: 'bg-primary-500/20' },
  proof_submitted: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
  completed:       { text: 'text-green-400',  bg: 'bg-green-500/20' },
};

function BookingItem({
  booking,
  onAccept,
  onReject,
  onComplete,
}: {
  booking: Booking;
  onAccept: () => void;
  onReject: () => void;
  onComplete: () => void;
}) {
  const cfg = BOOKING_STATUS_COLOR[booking.status];

  const handleCopyBuyerPubgId = async () => {
    if (!booking.buyerPubgId) return;
    await Clipboard.setStringAsync(booking.buyerPubgId);
    Alert.alert('Copied!', `Buyer PUBG ID ${booking.buyerPubgId} copied.`);
  };

  return (
    <View className="bg-surface-200 rounded-xl p-3 mb-2">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-white font-semibold">
          {booking.supplierName}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${cfg.bg}`}>
          <Text className={`text-xs font-semibold capitalize ${cfg.text}`}>
            {booking.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-surface-300 text-xs">
          Booked: <Text className="text-white">{booking.bookedAmount.toLocaleString()} POP</Text>
        </Text>
        {booking.supplierPubgId && (
          <Text className="text-surface-300 text-xs">
            Supplier ID: <Text className="text-white">{booking.supplierPubgId}</Text>
          </Text>
        )}
      </View>
      {booking.deliveryTime && (
        <Text className="text-surface-300 text-xs mb-1">
          Delivery: <Text className="text-yellow-400">
            {booking.deliveryTime === 'instant' ? '⚡ Instant' : `🕐 ${booking.deliveryTime}`}
          </Text>
        </Text>
      )}

      {/* Buyer PUBG ID attached at acceptance */}
      {booking.buyerPubgId && (
        <View className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-blue-400 text-xs font-semibold mb-0.5">Buyer PUBG ID attached:</Text>
              <Text className="text-white text-sm font-bold">{booking.buyerPubgId}</Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyBuyerPubgId}
              className="bg-blue-500/20 rounded-lg px-2 py-1 ml-2"
            >
              <Text className="text-blue-400 text-xs">📋 Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {booking.status === 'proof_submitted' && booking.proofUrl && (
        <View className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 mb-2">
          <Text className="text-purple-400 text-xs font-semibold mb-1">Proof submitted:</Text>
          <Text className="text-surface-300 text-xs" numberOfLines={2}>{booking.proofUrl}</Text>
          {booking.proofNotes && (
            <Text className="text-surface-300 text-xs mt-1">Notes: {booking.proofNotes}</Text>
          )}
        </View>
      )}

      {/* Action buttons */}
      <View className="flex-row gap-2">
        {booking.status === 'pending' && (
          <>
            <TouchableOpacity onPress={onAccept} className="flex-1 bg-green-600 rounded-lg py-2 items-center">
              <Text className="text-white text-xs font-bold">Accept + Attach PUBG ID</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onReject} className="flex-1 bg-red-500/30 rounded-lg py-2 items-center">
              <Text className="text-red-400 text-xs font-semibold">Reject</Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === 'proof_submitted' && (
          <TouchableOpacity onPress={onComplete} className="flex-1 bg-green-600 rounded-lg py-2 items-center">
            <Text className="text-white text-xs font-bold">✓ Verify & Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function RequestCard({
  request,
  onCancel,
}: {
  request: SellerRequest;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<Booking | null>(null);
  const [buyerPubgId, setBuyerPubgId] = useState('');
  const { bookings, isLoading: bookingsLoading } = useRequestBookings(
    expanded ? request.id : undefined,
  );
  const { mutate: updateBooking, isPending: updatingBooking } = useUpdateBookingStatus();

  const handleBookingAction = (booking: Booking, status: BookingStatus) => {
    updateBooking(
      { id: booking.id, status },
      {
        onError: (e) =>
          Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
      },
    );
  };

  const handleAcceptWithPubgId = () => {
    if (!acceptTarget) return;
    updateBooking(
      { id: acceptTarget.id, status: 'accepted', buyerPubgId: buyerPubgId.trim() || null },
      {
        onSuccess: () => { setAcceptTarget(null); setBuyerPubgId(''); },
        onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
      },
    );
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const proofBookings = bookings.filter((b) => b.status === 'proof_submitted').length;

  return (
    <View className="bg-surface-100 rounded-2xl p-4 mb-3">
      {/* Header row */}
      <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
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
            <Text className={`text-xs font-semibold capitalize ${STATUS_COLOR[request.status]}`}>
              {request.status.replace(/_/g, ' ')}
            </Text>
            <Text className="text-surface-300 text-xs">
              {request.remainingAmount.toLocaleString()} remaining
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

        <View className="flex-row justify-between items-center">
          <View className="flex-row gap-3">
            {pendingBookings > 0 && (
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <Text className="text-yellow-400 text-xs">{pendingBookings} pending</Text>
              </View>
            )}
            {proofBookings > 0 && (
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <Text className="text-purple-400 text-xs">{proofBookings} to verify</Text>
              </View>
            )}
          </View>
          <Text className="text-surface-300 text-xs">
            {expanded ? '▲ Hide' : '▼ Bookings'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded bookings */}
      {expanded && (
        <View className="mt-3 pt-3 border-t border-surface-200">
          {bookingsLoading ? (
            <ActivityIndicator color="#f59e0b" size="small" />
          ) : bookings.length === 0 ? (
            <Text className="text-surface-300 text-sm text-center py-2">
              No bookings yet
            </Text>
          ) : (
            bookings.map((b) => (
              <BookingItem
                key={b.id}
                booking={b}
                onAccept={() => { setBuyerPubgId(''); setAcceptTarget(b); }}
                onReject={() => handleBookingAction(b, 'rejected')}
                onComplete={() => handleBookingAction(b, 'completed')}
              />
            ))
          )}

          {/* Cancel request */}
          {['open', 'partially_booked'].includes(request.status) && (
            <TouchableOpacity
              onPress={onCancel}
              className="mt-2 py-2 items-center rounded-lg border border-red-500/30"
            >
              <Text className="text-red-400 text-xs font-semibold">Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Accept booking modal — capture buyer PUBG ID */}
      <Modal
        visible={!!acceptTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setAcceptTarget(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-3xl p-6">
            <Text className="text-white text-lg font-bold mb-1">Accept Booking</Text>
            {acceptTarget && (
              <Text className="text-surface-300 text-sm mb-4">
                {acceptTarget.supplierName} · {acceptTarget.bookedAmount.toLocaleString()} POP
              </Text>
            )}

            <View className="mb-2">
              <Text className="text-surface-300 text-sm mb-2">
                Buyer PUBG ID (supplier will send POP here)
              </Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                value={buyerPubgId}
                onChangeText={setBuyerPubgId}
                placeholder="e.g. 5123456789 (optional)"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="text-surface-400 text-xs mt-1">
                Leave blank to attach the PUBG ID later.
              </Text>
            </View>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 bg-surface-200 rounded-xl py-4 items-center"
                onPress={() => setAcceptTarget(null)}
                disabled={updatingBooking}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-4 items-center ${
                  updatingBooking ? 'bg-surface-200' : 'bg-green-600'
                }`}
                onPress={handleAcceptWithPubgId}
                disabled={updatingBooking}
              >
                <Text className="text-white font-bold">
                  {updatingBooking ? 'Accepting…' : '✓ Accept Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function SellerMyRequestsScreen() {
  const { user } = useAuthStore();
  const { requests, isLoading } = useSellerRequests(user?.uid);
  const { mutate: updateRequest } = useUpdateRequestStatus();
  const [filter, setFilter] = useState<FilterKey>('active');

  const filtered = requests.filter((r) => {
    if (filter === 'active') return ['open', 'partially_booked', 'fully_booked', 'in_progress'].includes(r.status);
    if (filter === 'completed') return ['completed', 'cancelled'].includes(r.status);
    return true;
  });

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Request', 'Cancel this POP request? Existing bookings may be affected.', [
      { text: 'Keep', style: 'cancel' },
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
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-yellow-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">My Requests</Text>
        <TouchableOpacity
          className="bg-yellow-500 rounded-xl px-3 py-1.5"
          onPress={() => router.push('/(seller)/post-request' as never)}
        >
          <Text className="text-white text-xs font-bold">+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View className="flex-row gap-2 px-4 py-3">
        {([
          { key: 'active' as FilterKey, label: 'Active' },
          { key: 'completed' as FilterKey, label: 'Completed' },
          { key: 'all' as FilterKey, label: 'All' },
        ]).map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            className={`rounded-full px-4 py-2 ${filter === f.key ? 'bg-yellow-500' : 'bg-surface-100'}`}
          >
            <Text className={`text-xs font-semibold ${filter === f.key ? 'text-white' : 'text-surface-300'}`}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f59e0b" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 40, flexGrow: 1 }} // eslint-disable-line react-native/no-inline-styles
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <Text className="text-surface-300 text-base mb-3">No requests found</Text>
              <TouchableOpacity
                className="bg-yellow-500 rounded-xl px-6 py-3"
                onPress={() => router.push('/(seller)/post-request' as never)}
              >
                <Text className="text-white font-bold">Post First Request</Text>
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
