import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
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
  verified:        { text: 'text-green-400',  bg: 'bg-green-500/20' },
  payout_submitted:{ text: 'text-indigo-400', bg: 'bg-indigo-500/20' },
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
  const videoRef = useRef<Video>(null);
  const [playing, setPlaying] = useState(false);

  const handleCopyBuyerPubgId = async () => {
    if (!booking.buyerPubgId) return;
    await Clipboard.setStringAsync(booking.buyerPubgId);
    Alert.alert('Copied!', `Buyer PUBG ID ${booking.buyerPubgId} copied.`);
  };

  return (
    <View className="bg-surface-200 rounded-xl p-3 mb-2 border border-surface-200/40">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-white font-semibold">
          {booking.supplierName}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${cfg.bg}`}>
          <Text className={`text-[10px] font-semibold capitalize ${cfg.text}`}>
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
      <View className="flex-row justify-between items-center mb-1">
        {booking.deliveryTime && (
          <Text className="text-surface-300 text-xs">
            Delivery: <Text className="text-yellow-400 font-medium">
              {booking.deliveryTime === 'instant' ? '⚡ Instant' : `🕐 ${booking.deliveryTime}`}
            </Text>
          </Text>
        )}
      </View>

      {/* Buyer PUBG ID attached at acceptance */}
      {booking.buyerPubgId && (
        <View className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-blue-400 text-[10px] font-semibold mb-0.5">Target Buyer PUBG ID:</Text>
              <Text className="text-white text-sm font-bold">{booking.buyerPubgId}</Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyBuyerPubgId}
              className="bg-blue-500/20 rounded-lg px-2.5 py-1 border border-blue-500/30"
            >
              <Text className="text-blue-400 text-xs font-bold">📋 Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Proof Submissions with Video support */}
      {booking.status === 'proof_submitted' && booking.proofUrl && (
        <View className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-2">
          <Text className="text-purple-400 text-xs font-bold mb-2">Supplier POP Proof:</Text>

          {booking.proofUrl === 'whatsapp' ? (
            <View className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-2 flex-row items-center gap-2">
              <Text className="text-xl">💬</Text>
              <View className="flex-1">
                <Text className="text-green-400 text-xs font-bold">Sent on WhatsApp</Text>
                <Text className="text-surface-400 text-[10px]">
                  Supplier has sent the video proof directly to your WhatsApp.
                </Text>
              </View>
            </View>
          ) : booking.proofUrl.includes('drive.google.com') ? (
            <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-2">
              <Text className="text-blue-400 text-xs font-bold mb-1">📁 Google Drive Video Proof</Text>
              <Text className="text-surface-300 text-xs mb-2" numberOfLines={1}>
                {booking.proofUrl}
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(booking.proofUrl!)}
                className="bg-blue-500 rounded-xl py-2.5 items-center justify-center flex-row gap-1.5"
              >
                <Text className="text-white text-xs font-bold">🔗 Open Google Drive Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Render Cloudinary Video Proof player
            <View className="bg-black rounded-xl overflow-hidden mb-2 relative aspect-video border border-purple-500/20">
              <Video
                ref={videoRef}
                source={{ uri: booking.proofUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={playing}
                isLooping={false}
                onPlaybackStatusUpdate={(s) => {
                  if ('didJustFinish' in s && s.didJustFinish) setPlaying(false);
                }}
              />
              {!playing && (
                <TouchableOpacity
                  onPress={() => setPlaying(true)}
                  className="absolute inset-0 items-center justify-center bg-black/35"
                >
                  <View className="bg-black/60 rounded-full w-14 h-14 items-center justify-center">
                    <Text className="text-white text-xl">▶</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {booking.proofNotes && (
            <Text className="text-surface-300 text-xs leading-relaxed bg-surface-100 p-2.5 rounded-lg border border-surface-200/30">
              <Text className="font-semibold text-purple-400">Notes: </Text>
              {booking.proofNotes}
            </Text>
          )}
        </View>
      )}

      {/* Action buttons */}
      <View className="flex-row gap-2 mt-1">
        {booking.status === 'pending' && (
          <>
            <TouchableOpacity onPress={onAccept} className="flex-1 bg-yellow-500 rounded-lg py-2 items-center">
              <Text className="text-slate-950 text-xs font-black">✓ Accept &amp; Attach PUBG</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onReject} className="flex-1 bg-red-500/30 rounded-lg py-2 items-center border border-red-500/20">
              <Text className="text-red-400 text-xs font-semibold">Reject</Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === 'proof_submitted' && (
          <TouchableOpacity onPress={onComplete} className="flex-1 bg-green-600 rounded-lg py-2 items-center">
            <Text className="text-white text-xs font-bold">✓ Verify &amp; Complete Deal</Text>
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
    <View className="bg-surface-100 rounded-2xl p-4 mb-3 border border-surface-200">
      {/* Header row */}
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.95}>
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="text-white font-bold text-lg">
              {request.totalPopAmount.toLocaleString()} POP
            </Text>
            {request.buyerOrderId && request.buyerRatePer10k !== undefined && request.buyerRatePer10k !== null ? (
              <View className="mt-1">
                <Text className="text-surface-400 text-[11px] leading-tight">
                  Buyer Rate: PKR {request.buyerRatePer10k}/10k
                </Text>
                <Text className="text-green-400 text-[11px] font-semibold leading-tight">
                  Supplier Rate: PKR {request.ratePer10k}/10k
                </Text>
                <Text className="text-yellow-400 text-[11px] font-bold leading-tight">
                  Your Profit Margin: PKR {(request.buyerRatePer10k - request.ratePer10k)}/10k
                </Text>
              </View>
            ) : (
              <Text className="text-surface-300 text-xs">
                Rate: PKR {request.ratePer10k}/10k
              </Text>
            )}
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
                <Text className="text-yellow-400 text-xs font-semibold">{pendingBookings} pending</Text>
              </View>
            )}
            {proofBookings > 0 && (
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <Text className="text-purple-400 text-xs font-semibold">{proofBookings} to verify</Text>
              </View>
            )}
          </View>
          <Text className="text-yellow-400 text-xs font-bold">
            {expanded ? '▲ Hide Bookings' : '▼ View Bookings'}
          </Text>
        </View>
      </TouchableOpacity>

      {request.buyerOrderId ? (
        <TouchableOpacity
          className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2.5 mt-3 flex-row items-center justify-between"
          onPress={() => router.push(`/orders/${request.buyerOrderId}`)}
        >
          <Text className="text-green-400 text-xs font-bold">
            🏪 Linked to Buyer Order #{request.buyerOrderId.slice(-6).toUpperCase()}
          </Text>
          <Text className="text-green-400 text-xs font-semibold">View Order →</Text>
        </TouchableOpacity>
      ) : null}

      {/* Expanded bookings */}
      {expanded && (
        <View className="mt-3 pt-3 border-t border-surface-200/50">
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
                onAccept={() => {
                  setBuyerPubgId(request.buyerPubgId || '');
                  setAcceptTarget(b);
                }}
                onReject={() => handleBookingAction(b, 'rejected')}
                onComplete={() => handleBookingAction(b, 'completed')}
              />
            ))
          )}

          {/* Cancel request */}
          {['open', 'partially_booked'].includes(request.status) && (
            <TouchableOpacity
              onPress={onCancel}
              className="mt-3 py-2.5 items-center rounded-xl border border-red-500/30 bg-red-500/5"
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
        animationType="fade"
        onRequestClose={() => setAcceptTarget(null)}
      >
        <View className="flex-1 justify-end bg-black/75">
          <View className="bg-surface rounded-t-3xl p-6 border-t border-surface-200">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">Accept Booking</Text>
              <TouchableOpacity onPress={() => setAcceptTarget(null)} className="p-1">
                <Text className="text-surface-400 text-base font-black">✕</Text>
              </TouchableOpacity>
            </View>

            {acceptTarget && (
              <View className="bg-surface-100 p-4 rounded-xl mb-4 border border-surface-200">
                <Text className="text-surface-300 text-sm mb-1">
                  {acceptTarget.supplierName} · {acceptTarget.bookedAmount.toLocaleString()} POP
                </Text>
                <Text className="text-surface-400 text-xs mt-1">
                  Provide the buyer PUBG ID where this supplier should send the POP units directly.
                </Text>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-surface-300 text-sm mb-2">
                Buyer PUBG ID (supplier will send POP here)
              </Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base border border-surface-200"
                value={buyerPubgId}
                onChangeText={setBuyerPubgId}
                placeholder="e.g. 5123456789"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numeric"
              />
              <Text className="text-surface-400 text-xs mt-1.5">
                Leave blank to attach the PUBG ID later.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-surface-200 rounded-xl py-4 items-center"
                onPress={() => setAcceptTarget(null)}
                disabled={updatingBooking}
              >
                <Text className="text-white font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-4 items-center ${
                  updatingBooking ? 'bg-surface-200' : 'bg-yellow-500'
                }`}
                onPress={handleAcceptWithPubgId}
                disabled={updatingBooking}
              >
                <Text className="text-slate-950 font-black">
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

export default function SellerSupplierRequestsScreen() {
  const { user } = useAuthStore();
  const { requests, isLoading } = useSellerRequests(user?.uid);
  const { mutate: updateRequest } = useUpdateRequestStatus();
  const [filter, setFilter] = useState<FilterKey>('active');

  const filtered = requests.filter((r) => {
    if (r.targetAudience !== 'supplier') return false;
    if (filter === 'active') return ['open', 'partially_booked', 'fully_booked', 'in_progress'].includes(r.status);
    if (filter === 'completed') return ['completed', 'cancelled'].includes(r.status);
    return true;
  });

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Request', 'Cancel this POP request? Existing bookings may be affected.', [
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
        <Text className="text-white text-lg font-bold flex-1">Supplier Requests</Text>
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
          <Text className="text-surface-400 text-xs mt-2">Loading supplier requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 10, paddingBottom: 40, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20 px-8">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-white text-base font-bold mb-2">No supplier requests found</Text>
              <Text className="text-surface-400 text-sm text-center">
                Create a Supplier Request to buy popularity in bulk from supplier users in the platform.
              </Text>
              <TouchableOpacity
                className="bg-yellow-500 rounded-xl px-6 py-3 mt-6"
                onPress={() => router.push('/(seller)/post-request' as never)}
              >
                <Text className="text-slate-950 font-bold">Post Supplier Request</Text>
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
