import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
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
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import {
  useSupplierBookings,
  useSubmitBookingProof,
  useRequest,
} from '@/features/requests/hooks/useRequests';
import { profileService } from '@/features/profile/services/profileService';
import { uploadToCloudinary } from '@/lib/cloudinary';
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

  // Hybrid Flow & Uploading states
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'image' | 'video' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [sellerWhatsapp, setSellerWhatsapp] = useState<string>('');

  const filtered = bookings.filter((b) => {
    if (filter === 'active') return ['pending', 'accepted', 'in_progress', 'proof_submitted'].includes(b.status);
    if (filter === 'completed') return ['completed', 'rejected'].includes(b.status);
    return true;
  });

  const handlePickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos', 'images'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedUri(asset.uri);
        setSelectedType(asset.type === 'video' ? 'video' : 'image');
        setProofError(null);
      }
    } catch (err) {
      setProofError('Failed to access photo gallery.');
    }
  };

  const handleSendWhatsApp = async () => {
    if (!proofBooking) return;

    const whatsappNum = sellerWhatsapp || '+923001234567';

    const richMessage = `*PUBG POP BOOKING ESCROW PROOF*
----------------------------------------
*Booking ID:* ${proofBooking.id}
*Request ID:* ${proofBooking.requestId}
*Amount:* ${proofBooking.bookedAmount.toLocaleString()} POP
*Target PUBG ID:* ${proofBooking.buyerPubgId ?? 'N/A'}
*Supplier Name:* ${proofBooking.supplierName}
*Method:* WhatsApp Fallback

Hello! I have successfully delivered the committed POP to the Buyer's PUBG ID. Sending screen recording/screenshot proof here. Please confirm receipt and release escrow payout!`;

    const cleanPhone = whatsappNum.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(richMessage)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        setUploading(true);
        submitProof(
          { id: proofBooking.id, proofUrl: 'whatsapp', proofNotes: 'Sent via WhatsApp Fallback' },
          {
            onSuccess: async () => {
              setProofBooking(null);
              setUploading(false);
              await Linking.openURL(url);
            },
            onError: (e) => {
              setProofError(e instanceof Error ? e.message : 'Failed to mark as sent');
              setUploading(false);
            },
          },
        );
      } else {
        Alert.alert(
          'WhatsApp Required',
          'WhatsApp is not installed on this device. Please install WhatsApp to use this fallback option.',
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open WhatsApp.');
    }
  };

  const handleSubmitProof = async () => {
    if (!proofBooking) return;

    let finalProofUrl = proofUrl.trim();

    // Option A: Upload picked file to Cloudinary
    if (selectedUri) {
      try {
        setUploading(true);
        setProofError(null);
        const folder = `proof-bookings/${proofBooking.id}`;
        const cloudinaryResult = await uploadToCloudinary(
          selectedUri,
          folder,
          selectedType === 'video' ? 'video' : 'image',
          (progress) => setUploadProgress(progress),
        );
        finalProofUrl = cloudinaryResult.secure_url;
      } catch (err) {
        setProofError(err instanceof Error ? err.message : 'Failed to upload proof file.');
        setUploading(false);
        return;
      }
    }

    if (!finalProofUrl) {
      setProofError('Please upload a file, send via WhatsApp, or enter a valid proof link.');
      setUploading(false);
      return;
    }

    if (finalProofUrl.toLowerCase() !== 'whatsapp' && finalProofUrl.length < 10) {
      setProofError('Enter a valid proof URL or select a file to upload.');
      setUploading(false);
      return;
    }

    submitProof(
      { id: proofBooking.id, proofUrl: finalProofUrl, proofNotes: proofNotes.trim() || null },
      {
        onSuccess: () => {
          setProofBooking(null);
          setProofUrl('');
          setSelectedUri(null);
          setSelectedType(null);
          setUploadProgress(0);
          setUploading(false);
          setProofNotes('');
          Alert.alert('Proof Submitted!', 'The seller will verify and mark your booking complete.');
        },
        onError: (e) => {
          setProofError(e instanceof Error ? e.message : 'Failed to submit proof');
          setUploading(false);
        },
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
              setSelectedUri(null);
              setSelectedType(null);
              setUploadProgress(0);
              setProofNotes('');
              setProofError(null);
              setSellerWhatsapp('');
              profileService.getById(item.sellerId).then((profile) => {
                if (profile?.whatsappNumber) {
                  setSellerWhatsapp(profile.whatsappNumber);
                }
              }).catch(() => {});
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
          <View className="bg-surface rounded-t-3xl p-6 max-h-[85%]">
            <Text className="text-white text-xl font-bold mb-1">Submit Proof</Text>
            <Text className="text-surface-300 text-xs mb-5">
              Choose your preferred method to submit delivery proof to the seller.
            </Text>

            <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
              
              {/* Option A: Upload Media */}
              <View className="bg-surface-100 border border-primary-500/20 rounded-2xl p-4 mb-4">
                <Text className="text-primary-400 font-bold text-sm mb-1">Option A: In-App Upload (Primary)</Text>
                <Text className="text-surface-300 text-xs mb-3">
                  Upload a screen recording or screenshot of the transaction directly.
                </Text>

                {selectedUri ? (
                  <View className="bg-surface-200 border border-green-500/30 rounded-xl p-3 flex-row items-center justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="text-green-400 text-xs font-semibold mb-0.5">✓ Ready to Upload</Text>
                      <Text className="text-white text-xs" numberOfLines={1}>
                        {selectedUri.split('/').pop()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="bg-surface-100 rounded-lg px-3 py-2 border border-surface-300"
                      onPress={() => {
                        setSelectedUri(null);
                        setSelectedType(null);
                      }}
                    >
                      <Text className="text-surface-300 text-xs font-bold">Clear</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    className="bg-primary-500/10 border border-primary-500/40 rounded-xl py-3 items-center"
                    onPress={handlePickFile}
                  >
                    <Text className="text-primary-400 font-bold text-sm">📁 Select Video / Image from Gallery</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Option B: WhatsApp Fallback */}
              <View className="bg-surface-100 border border-green-500/20 rounded-2xl p-4 mb-4">
                <Text className="text-green-400 font-bold text-sm mb-1">Option B: Send via WhatsApp (Fallback)</Text>
                <Text className="text-surface-300 text-xs mb-3">
                  Open WhatsApp with a pre-filled transaction template and send proof directly to the seller.
                </Text>

                <TouchableOpacity
                  className="bg-green-500/10 border border-green-500/40 rounded-xl py-3 items-center flex-row justify-center gap-2"
                  onPress={handleSendWhatsApp}
                >
                  <Text className="text-green-400 text-sm">💬</Text>
                  <Text className="text-green-400 font-bold text-sm">Open WhatsApp &amp; Send</Text>
                </TouchableOpacity>
              </View>

              {/* Option C: Paste URL */}
              {!selectedUri && (
                <View className="bg-surface-100 border border-surface-200 rounded-2xl p-4 mb-4">
                  <Text className="text-white font-bold text-sm mb-1">Option C: Paste External Link</Text>
                  <Text className="text-surface-300 text-xs mb-3">
                    Paste a link to your screen recording (Google Drive, YouTube, etc.)
                  </Text>
                  <TextInput
                    className="bg-surface-200 text-white rounded-xl px-4 py-3 text-xs border border-surface-300"
                    value={proofUrl}
                    onChangeText={(v) => { setProofUrl(v); setProofError(null); }}
                    placeholder="https://drive.google.com/..."
                    placeholderTextColor="#475569"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              {/* Notes */}
              <View className="mb-4">
                <Text className="text-surface-300 text-xs mb-1.5">Notes (optional)</Text>
                <TextInput
                  className="bg-surface-100 text-white rounded-xl px-4 py-3 text-xs"
                  value={proofNotes}
                  onChangeText={setProofNotes}
                  placeholder="Any notes or remarks for the seller..."
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={2}
                  style={{ textAlignVertical: 'top' }}
                />
              </View>

              {/* Upload Progress */}
              {uploading && (
                <View className="bg-surface-100 rounded-2xl p-4 mb-4 border border-surface-200">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-white text-xs font-semibold">Uploading proof media...</Text>
                    <Text className="text-primary-400 text-xs font-bold">{uploadProgress}%</Text>
                  </View>
                  <View className="bg-surface-200 h-2 rounded-full overflow-hidden">
                    <View
                      className="bg-primary-500 h-full rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </View>
                </View>
              )}

              {proofError && (
                <View className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-4">
                  <Text className="text-red-400 text-xs">{proofError}</Text>
                </View>
              )}
            </ScrollView>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-surface-200 rounded-xl py-4 items-center"
                onPress={() => setProofBooking(null)}
                disabled={uploading || submitting}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-xl py-4 items-center ${(uploading || submitting) ? 'bg-surface-200' : 'bg-green-600'}`}
                onPress={handleSubmitProof}
                disabled={uploading || submitting}
              >
                <Text className="text-white font-bold">
                  {uploading ? 'Uploading…' : submitting ? 'Submitting…' : 'Submit Proof'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
