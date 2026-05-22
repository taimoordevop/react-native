import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import {
  useSupplierBookings,
  useSubmitBookingProof,
  useRequest,
} from '@/features/requests/hooks/useRequests';
import type { Booking, BookingStatus } from '@/shared/types';

type FilterKey = 'active' | 'completed' | 'all';

const STATUS_CFG: Record<BookingStatus, { label: string; text: string; bg: string }> = {
  pending:         { label: 'Pending',        text: 'text-yellow-400',  bg: 'bg-yellow-500/20' },
  accepted:        { label: 'Accepted',       text: 'text-blue-400',    bg: 'bg-blue-500/20' },
  rejected:        { label: 'Rejected',       text: 'text-red-400',     bg: 'bg-red-500/20' },
  in_progress:     { label: 'In Progress',    text: 'text-primary-400', bg: 'bg-primary-500/20' },
  proof_submitted: { label: 'Proof Sent',     text: 'text-purple-400',  bg: 'bg-purple-500/20' },
  completed:       { label: 'Completed',      text: 'text-green-400',   bg: 'bg-green-500/20' },
};

function BookingCard({
  booking,
  onSubmitProof,
}: {
  booking: Booking;
  onSubmitProof: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[booking.status];
  const { data: request } = useRequest(booking.requestId);

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      className="bg-surface-100 rounded-2xl p-4 mb-3"
      activeOpacity={0.85}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-white font-bold text-lg">
            {booking.bookedAmount.toLocaleString()} POP
          </Text>
          <Text className="text-surface-300 text-xs">
            {booking.deliveryTime === 'instant' ? '⚡ Instant delivery' : `🕐 ${booking.deliveryTime}`}
          </Text>
        </View>
        <View className="items-end gap-1">
          <View className={`px-2 py-1 rounded-full ${cfg.bg}`}>
            <Text className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</Text>
          </View>
          <Text className="text-surface-400 text-xs">{expanded ? '▲' : '▼ details'}</Text>
        </View>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View className="mt-2 pt-3 border-t border-surface-200">

          {/* Accepted — show where to send */}
          {booking.status === 'accepted' && (
            <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-3">
              <Text className="text-blue-400 text-xs font-semibold mb-2">✓ Booking Accepted — Send POP now</Text>

              {/* Buyer PUBG ID attached by seller — highest priority destination */}
              {booking.buyerPubgId ? (
                <View className="mb-2">
                  <Text className="text-surface-300 text-xs mb-0.5">Send POP to Buyer PUBG ID:</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-bold text-base flex-1">{booking.buyerPubgId}</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        await Clipboard.setStringAsync(booking.buyerPubgId!);
                        Alert.alert('Copied!', `Buyer PUBG ID ${booking.buyerPubgId} copied.`);
                      }}
                      className="bg-blue-500/20 border border-blue-500/40 rounded-lg px-2 py-1 ml-2"
                    >
                      <Text className="text-blue-400 text-xs font-semibold">📋 Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : request?.destinationPubgId ? (
                <View className="mb-2">
                  <Text className="text-surface-300 text-xs mb-0.5">Send to PUBG ID:</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-bold text-base flex-1">{request.destinationPubgId}</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        await Clipboard.setStringAsync(request.destinationPubgId!);
                        Alert.alert('Copied!', `PUBG ID ${request.destinationPubgId} copied.`);
                      }}
                      className="bg-green-500/20 border border-green-500/40 rounded-lg px-2 py-1 ml-2"
                    >
                      <Text className="text-green-400 text-xs font-semibold">📋 Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {request?.deliveryDeadline && (
                <View className="mb-1">
                  <Text className="text-surface-300 text-xs mb-0.5">Deadline:</Text>
                  <Text className="text-yellow-400 text-sm font-semibold">{request.deliveryDeadline}</Text>
                </View>
              )}

              <View>
                <Text className="text-surface-300 text-xs mb-0.5">Your committed delivery:</Text>
                <Text className="text-white text-sm">
                  {booking.deliveryTime === 'instant' ? '⚡ Instantly' : `🕐 ${booking.deliveryTime}`}
                </Text>
              </View>
            </View>
          )}

          {/* Booking amount earned */}
          {request && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-surface-300 text-xs">You earn:</Text>
              <Text className="text-green-400 text-sm font-bold">
                PKR {Math.round((booking.bookedAmount / 10000) * request.ratePer10k).toLocaleString()}
              </Text>
            </View>
          )}

          {booking.status === 'proof_submitted' && (
            <View className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-3">
              <Text className="text-purple-400 text-xs font-semibold">Proof submitted — awaiting seller verification.</Text>
              {booking.proofUrl && (
                <Text className="text-surface-300 text-xs mt-1" numberOfLines={2}>{booking.proofUrl}</Text>
              )}
            </View>
          )}

          {booking.status === 'rejected' && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-2">
              <Text className="text-red-400 text-xs">Booking was rejected by the seller.</Text>
            </View>
          )}

          {booking.status === 'completed' && (
            <View className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-2">
              <Text className="text-green-400 text-xs font-semibold">✓ Completed — payment released.</Text>
            </View>
          )}

          {/* Send POP → Submit proof button */}
          {booking.status === 'accepted' && (
            <TouchableOpacity
              className="bg-green-600 rounded-xl py-3 items-center mt-1"
              onPress={onSubmitProof}
            >
              <Text className="text-white font-bold">✓ Mark POP Sent + Submit Proof</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SupplierMyBookingsScreen() {
  const { user } = useAuth();
  const { bookings, isLoading } = useSupplierBookings(user?.uid);
  const { mutate: submitProof, isPending: submitting } = useSubmitBookingProof();

  const [filter, setFilter] = useState<FilterKey>('active');
  const [proofBooking, setProofBooking] = useState<Booking | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [proofError, setProofError] = useState<string | null>(null);

  const filtered = bookings.filter((b) => {
    if (filter === 'active') return ['pending', 'accepted', 'in_progress', 'proof_submitted'].includes(b.status);
    if (filter === 'completed') return ['completed', 'rejected'].includes(b.status);
    return true;
  });

  const handleSubmitProof = () => {
    if (!proofBooking) return;
    if (!proofUrl.trim() || proofUrl.trim().length < 10) {
      setProofError('Enter a valid proof URL (Google Drive, YouTube, etc.)');
      return;
    }
    submitProof(
      { id: proofBooking.id, proofUrl: proofUrl.trim(), proofNotes: proofNotes.trim() || null },
      {
        onSuccess: () => {
          setProofBooking(null);
          setProofUrl('');
          setProofNotes('');
          Alert.alert('Proof Submitted!', 'The seller will verify and mark your booking complete.');
        },
        onError: (e) => setProofError(e instanceof Error ? e.message : 'Failed to submit'),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold mb-4">My Bookings</Text>
        <View className="flex-row gap-2">
          {([
            { key: 'active' as FilterKey, label: 'Active' },
            { key: 'completed' as FilterKey, label: 'Done' },
            { key: 'all' as FilterKey, label: 'All' },
          ]).map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 ${filter === f.key ? 'bg-green-600' : 'bg-surface-100'}`}
            >
              <Text className={`text-xs font-semibold ${filter === f.key ? 'text-white' : 'text-surface-300'}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#10b981" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 32, flexGrow: 1 }} // eslint-disable-line react-native/no-inline-styles
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <Text className="text-surface-300 text-base mb-1">No bookings yet</Text>
              <Text className="text-surface-400 text-sm">Browse Requests to start earning</Text>
            </View>
          }
          renderItem={({ item }) => <BookingCard
            booking={item}
            onSubmitProof={() => {
              setProofBooking(item);
              setProofUrl('');
              setProofNotes('');
              setProofError(null);
            }}
          />}
        />
      )}

      {/* Proof submission modal */}
      <Modal
        visible={!!proofBooking}
        transparent
        animationType="slide"
        onRequestClose={() => setProofBooking(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-3xl p-6">
            <Text className="text-white text-xl font-bold mb-1">Submit Proof</Text>
            <Text className="text-surface-300 text-sm mb-5">
              Paste a link to your screen recording (Google Drive, YouTube, etc.)
            </Text>

            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-2">Proof URL *</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-sm"
                value={proofUrl}
                onChangeText={(v) => { setProofUrl(v); setProofError(null); }}
                placeholder="https://drive.google.com/..."
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="mb-5">
              <Text className="text-surface-300 text-sm mb-2">Notes (optional)</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-3 text-sm"
                value={proofNotes}
                onChangeText={setProofNotes}
                placeholder="Any notes for the seller..."
                placeholderTextColor="#475569"
                multiline
                numberOfLines={2}
                // eslint-disable-next-line react-native/no-inline-styles
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {proofError && (
              <View className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm">{proofError}</Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-surface-200 rounded-xl py-4 items-center"
                onPress={() => setProofBooking(null)}
                disabled={submitting}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-4 items-center ${submitting ? 'bg-surface-200' : 'bg-green-600'}`}
                onPress={handleSubmitProof}
                disabled={submitting}
              >
                <Text className="text-white font-bold">
                  {submitting ? 'Submitting…' : 'Submit Proof'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
