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
  useArchiveRequest,
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

const STATUS_BG: Record<string, string> = {
  open:              'bg-yellow-500/10 border-yellow-500/20',
  partially_booked:  'bg-orange-500/10 border-orange-500/20',
  fully_booked:      'bg-blue-500/10 border-blue-500/20',
  in_progress:       'bg-primary-500/10 border-primary-500/20',
  completed:         'bg-green-500/10 border-green-500/20',
  cancelled:         'bg-surface-200/10 border-surface-200/20',
};

const BOOKING_STATUS_COLOR: Record<BookingStatus, { text: string; bg: string; border: string }> = {
  pending:         { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  accepted:        { text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  rejected:        { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  in_progress:     { text: 'text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
  proof_submitted: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  verified:        { text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  payout_submitted:{ text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  completed:       { text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
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
    <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-3 mb-2">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-white font-semibold">
          {booking.supplierName}
        </Text>
        <View className={`px-2 py-0.5 rounded border ${cfg.bg} ${cfg.border}`}>
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
        <View style={{ backgroundColor: 'rgba(30,41,59,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-2 mb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[#D4A017] text-[9px] font-bold mb-0.5 uppercase">Target Buyer PUBG ID:</Text>
              <Text className="text-white text-sm font-bold">{booking.buyerPubgId}</Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyBuyerPubgId}
              style={{
                borderWidth: 1,
                borderColor: 'rgba(212,160,23,0.3)',
                backgroundColor: 'rgba(212,160,23,0.05)',
                borderRadius: 2,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text className="text-[#D4A017] text-[10px] font-bold">📋 COPY</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Proof Submissions with Video support */}
      {booking.status === 'proof_submitted' && booking.proofUrl && (
        <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.08)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)', borderRadius: 4 }} className="p-3 mb-2">
          <Text style={{ letterSpacing: 1 }} className="text-purple-400 text-[10px] font-bold uppercase mb-2">Supplier POP Proof:</Text>

          {booking.proofUrl === 'whatsapp' ? (
            <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.06)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)', borderRadius: 4 }} className="p-3 mb-2 flex-row items-center gap-2">
              <Text className="text-xl">💬</Text>
              <View className="flex-1">
                <Text style={{ letterSpacing: 1 }} className="text-green-400 text-xs font-bold uppercase">Sent on WhatsApp</Text>
                <Text className="text-surface-400 text-xxs">
                  Supplier has sent the video proof directly to your WhatsApp.
                </Text>
              </View>
            </View>
          ) : booking.proofUrl.includes('drive.google.com') ? (
            <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.06)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)', borderRadius: 4 }} className="p-3 mb-2">
              <Text style={{ letterSpacing: 1 }} className="text-blue-400 text-xs font-bold uppercase mb-1">📁 Google Drive Video Proof</Text>
              <Text className="text-surface-300 text-xxs mb-2" numberOfLines={1}>
                {booking.proofUrl}
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(booking.proofUrl!)}
                style={{
                  borderWidth: 1.5,
                  borderColor: '#3b82f6',
                  borderRadius: 2,
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text className="text-white text-xs font-bold uppercase">🔗 Open Google Drive Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Render Cloudinary Video Proof player
            <View className="bg-black rounded overflow-hidden mb-2 relative aspect-video border border-purple-500/20">
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
            <Text style={{ backgroundColor: 'rgba(30,41,59,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="text-surface-300 text-xs leading-relaxed p-2.5">
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
            <TouchableOpacity 
              onPress={onAccept} 
              style={{
                borderWidth: 1.5,
                borderColor: '#D4A017',
                borderRadius: 2,
                backgroundColor: 'rgba(212, 160, 23, 0.15)',
                paddingVertical: 10,
                alignItems: 'center',
              }}
              className="flex-1"
            >
              <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-bold uppercase">✓ Accept &amp; Attach PUBG</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onReject} 
              style={{
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                borderRadius: 2,
                paddingVertical: 10,
                alignItems: 'center',
              }}
              className="flex-1"
            >
              <Text style={{ letterSpacing: 1 }} className="text-red-400 text-xs font-bold uppercase">Reject</Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === 'proof_submitted' && (
          <TouchableOpacity 
            onPress={onComplete} 
            style={{
              borderWidth: 1.5,
              borderColor: '#22c55e',
              borderRadius: 2,
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              paddingVertical: 10,
              alignItems: 'center',
            }}
            className="flex-1"
          >
            <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-bold uppercase">✓ Verify &amp; Complete Deal</Text>
          </TouchableOpacity>
        )}
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
    <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.2)', borderRadius: 4 }} className="p-4 mb-3">
      {/* Header row */}
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.95}>
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="text-white font-bold text-lg">
              {request.totalPopAmount.toLocaleString()} POP
            </Text>
            {request.buyerOrderId && request.buyerRatePer10k !== undefined && request.buyerRatePer10k !== null ? (
              <View className="mt-1">
                <Text className="text-surface-400 text-[10px] leading-tight">
                  Buyer Rate: PKR {request.buyerRatePer10k}/10k
                </Text>
                <Text className="text-green-400 text-[10px] font-semibold leading-tight">
                  Supplier Rate: PKR {request.ratePer10k}/10k
                </Text>
                <Text className="text-[#D4A017] text-[10px] font-bold leading-tight uppercase">
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
            <View className={`px-2 py-0.5 rounded border ${STATUS_BG[request.status]}`}>
              <Text className={`text-[10px] font-bold capitalize ${STATUS_COLOR[request.status]}`}>
                {request.status.replace(/_/g, ' ')}
              </Text>
            </View>
            <Text className="text-surface-300 text-xs">
              {request.remainingAmount.toLocaleString()} remaining
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

        <View className="flex-row justify-between items-center">
          <View className="flex-row gap-3">
            {pendingBookings > 0 && (
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <Text style={{ letterSpacing: 1 }} className="text-yellow-400 text-[10px] font-bold uppercase">{pendingBookings} pending</Text>
              </View>
            )}
            {proofBookings > 0 && (
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <Text style={{ letterSpacing: 1 }} className="text-purple-400 text-[10px] font-bold uppercase">{proofBookings} to verify</Text>
              </View>
            )}
          </View>
          <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-xs font-bold uppercase">
            {expanded ? '▲ Hide Bookings' : '▼ View Bookings'}
          </Text>
        </View>
      </TouchableOpacity>

      {request.buyerOrderId ? (
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            borderWidth: 1.5,
            borderColor: 'rgba(34, 197, 94, 0.3)',
            borderRadius: 4,
            padding: 10,
            marginTop: 12,
          }}
          className="flex-row items-center justify-between"
          onPress={() => router.push(`/orders/${request.buyerOrderId}`)}
        >
          <Text style={{ letterSpacing: 1 }} className="text-green-400 text-xxs font-bold uppercase">
            🏪 Linked to Buyer Order #{request.buyerOrderId.slice(-6).toUpperCase()}
          </Text>
          <Text className="text-green-400 text-xxs font-semibold">View Order →</Text>
        </TouchableOpacity>
      ) : null}

      {/* Expanded bookings */}
      {expanded && (
        <View style={{ borderTopColor: 'rgba(255,255,255,0.06)' }} className="mt-3 pt-3 border-t">
          {bookingsLoading ? (
            <ActivityIndicator color="#D4A017" size="small" />
          ) : bookings.length === 0 ? (
            <Text className="text-surface-300 text-xs text-center py-2">
              No active bookings.
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

          {/* Cancel or Remove request */}
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
              className="mt-3"
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
              className="mt-3"
            >
              <Text style={{ letterSpacing: 1 }} className="text-red-400 text-xs font-bold uppercase">Remove from List</Text>
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
          <View style={{ backgroundColor: '#090d16', borderTopWidth: 1.5, borderTopColor: 'rgba(212, 160, 23, 0.3)', borderTopLeftRadius: 16, borderTopRightRadius: 16 }} className="p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text style={{ letterSpacing: 1 }} className="text-white text-base font-bold uppercase">Accept Booking</Text>
              <TouchableOpacity onPress={() => setAcceptTarget(null)} className="p-1">
                <Text className="text-surface-400 text-base font-black">✕</Text>
              </TouchableOpacity>
            </View>

            {acceptTarget && (
              <View style={{ backgroundColor: 'rgba(30,41,59,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4 mb-4">
                <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold">
                  {acceptTarget.supplierName} · {acceptTarget.bookedAmount.toLocaleString()} POP
                </Text>
                <Text className="text-surface-400 text-xxs mt-1 leading-relaxed">
                  Provide the buyer PUBG ID where this supplier should send the POP units directly.
                </Text>
              </View>
            )}

            <View className="mb-6">
              <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-semibold uppercase mb-2">
                Buyer PUBG ID (supplier will send POP here)
              </Text>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(30,41,59,0.4)',
                  color: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                }}
                value={buyerPubgId}
                onChangeText={setBuyerPubgId}
                placeholder="e.g. 5123456789"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numeric"
              />
              <Text className="text-surface-400 text-xxs mt-1.5">
                Leave blank to attach the PUBG ID later.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                style={{
                  borderWidth: 1.5,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                className="flex-1"
                onPress={() => setAcceptTarget(null)}
                disabled={updatingBooking}
              >
                <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-bold uppercase">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderWidth: 1.5,
                  borderColor: '#D4A017',
                  borderRadius: 2,
                  backgroundColor: 'rgba(212, 160, 23, 0.15)',
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                className="flex-1"
                onPress={handleAcceptWithPubgId}
                disabled={updatingBooking}
              >
                <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-bold uppercase">
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
  const { mutate: archiveRequest } = useArchiveRequest();
  const [filter, setFilter] = useState<FilterKey>('active');

  const filtered = requests.filter((r) => {
    if (r.archived === true) return false;
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
        <Text style={{ letterSpacing: 1 }} className="text-white text-base font-bold flex-1 uppercase">SUPPLIER REQUESTS</Text>
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
          <Text style={{ letterSpacing: 1 }} className="text-surface-400 text-xxs mt-2 uppercase">Loading supplier requests...</Text>
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
                Create a Supplier Request to buy popularity in bulk from supplier users in the platform.
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
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1.5 }} className="uppercase">Post Supplier Request</Text>
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
