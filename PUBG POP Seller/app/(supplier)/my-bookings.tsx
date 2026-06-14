import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import {
  useSupplierBookings,
  useSubmitBookingProof,
  useRequest,
} from '@/features/requests/hooks/useRequests';
import { profileService } from '@/features/profile/services/profileService';
import { orderService } from '@/features/orders/services/orderService';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { Booking, BookingStatus } from '@/shared/types';

type FilterKey = 'active' | 'completed' | 'all';

const STATUS_CFG: Record<BookingStatus, { label: string; text: string; bg: string; border: string }> = {
  pending:         { label: 'Pending',        text: 'text-yellow-400',  bg: 'rgba(234, 179, 8, 0.08)',  border: 'rgba(234, 179, 8, 0.2)' },
  accepted:        { label: 'Accepted',       text: 'text-blue-400',    bg: 'rgba(59, 130, 246, 0.08)',  border: 'rgba(59, 130, 246, 0.2)' },
  rejected:        { label: 'Rejected',       text: 'text-red-400',     bg: 'rgba(239, 68, 68, 0.08)',  border: 'rgba(239, 68, 68, 0.2)' },
  in_progress:     { label: 'In Progress',    text: 'text-[#D4A017]',   bg: 'rgba(212, 160, 23, 0.08)', border: 'rgba(212, 160, 23, 0.2)' },
  proof_submitted: { label: 'Proof Sent',     text: 'text-purple-400',  bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.2)' },
  verified:        { label: 'POP Verified',   text: 'text-green-400',   bg: 'rgba(34, 197, 94, 0.08)',  border: 'rgba(34, 197, 94, 0.2)' },
  payout_submitted:{ label: 'Paid (Verify)',  text: 'text-indigo-400',  bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.2)' },
  completed:       { label: 'Completed',      text: 'text-green-400',   bg: 'rgba(34, 197, 94, 0.08)',  border: 'rgba(34, 197, 94, 0.2)' },
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

function CornerReticles() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <View style={{ position: 'absolute', top: 16, left: 16, width: 16, height: 16, borderLeftWidth: 2, borderTopWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', top: 16, right: 16, width: 16, height: 16, borderRightWidth: 2, borderTopWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 16, left: 16, width: 16, height: 16, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 16, right: 16, width: 16, height: 16, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
    </View>
  );
}

function BookingCard({
  booking,
  onSubmitProof,
  onZoomImage,
}: {
  booking: Booking;
  onSubmitProof: () => void;
  onZoomImage: (url: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[booking.status] || STATUS_CFG.pending;
  const { data: request } = useRequest(booking.requestId);

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.2)', borderRadius: 4 }}
      className="p-4 mb-3"
      activeOpacity={0.85}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-white font-bold text-lg">
            {booking.bookedAmount.toLocaleString()} POP
          </Text>
          <Text className="text-surface-300 text-xxs mt-0.5">
            {booking.deliveryTime === 'instant' ? '⚡ Instant delivery' : `🕐 ${booking.deliveryTime}`}
          </Text>
        </View>
        <View className="items-end gap-1">
          <View style={{ borderWidth: 1, borderColor: cfg.border, backgroundColor: cfg.bg, borderRadius: 2 }} className="px-2 py-0.5">
            <Text style={{ letterSpacing: 0.5 }} className={`text-[10px] font-bold uppercase ${cfg.text}`}>{cfg.label}</Text>
          </View>
          <Text style={{ letterSpacing: 0.5 }} className="text-surface-400 text-xxs uppercase mt-0.5">{expanded ? '▲ Hide' : '▼ Details'}</Text>
        </View>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }} className="mt-2 pt-3">

          {/* Accepted — show where to send */}
          {booking.status === 'accepted' && (
            <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', borderWidth: 1.5, borderColor: 'rgba(59, 130, 246, 0.3)', borderRadius: 4 }} className="p-3 mb-3">
              <Text className="text-blue-400 text-xxs font-bold uppercase mb-2">✓ Booking Accepted — Send POP now</Text>

              {/* Buyer PUBG ID attached by seller — highest priority destination */}
              {booking.buyerPubgId ? (
                <View className="mb-2">
                  <Text className="text-surface-300 text-xxs mb-1">Send POP to Buyer PUBG ID:</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-bold text-base flex-1">{booking.buyerPubgId}</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        await Clipboard.setStringAsync(booking.buyerPubgId!);
                        Alert.alert('Copied!', `Buyer PUBG ID ${booking.buyerPubgId} copied.`);
                      }}
                      style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', borderRadius: 2 }}
                      className="px-2 py-1 ml-2"
                    >
                      <Text style={{ letterSpacing: 0.5 }} className="text-blue-400 text-xxs font-bold uppercase">📋 Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : request?.destinationPubgId ? (
                <View className="mb-2">
                  <Text className="text-surface-300 text-xxs mb-1">Send to PUBG ID:</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-bold text-base flex-1">{request.destinationPubgId}</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        await Clipboard.setStringAsync(request.destinationPubgId!);
                        Alert.alert('Copied!', `PUBG ID ${request.destinationPubgId} copied.`);
                      }}
                      style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 2 }}
                      className="px-2 py-1 ml-2"
                    >
                      <Text style={{ letterSpacing: 0.5 }} className="text-green-400 text-xxs font-bold uppercase">📋 Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {request?.deliveryDeadline && (
                <View className="mb-1">
                  <Text className="text-surface-300 text-xxs mb-0.5">Deadline:</Text>
                  <Text className="text-yellow-400 text-xs font-bold">{request.deliveryDeadline}</Text>
                </View>
              )}

              <View>
                <Text className="text-surface-300 text-xxs mb-0.5">Your committed delivery:</Text>
                <Text className="text-white text-xs">
                  {booking.deliveryTime === 'instant' ? '⚡ Instantly' : `🕐 ${booking.deliveryTime}`}
                </Text>
              </View>
            </View>
          )}

          {/* Booking amount earned */}
          {request && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-surface-300 text-xxs uppercase">You earn:</Text>
              <Text className="text-green-400 text-xs font-bold">
                PKR {Math.round((booking.bookedAmount / 10000) * request.ratePer10k).toLocaleString()}
              </Text>
            </View>
          )}

          {booking.status === 'proof_submitted' && (
            <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.08)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)', borderRadius: 4 }} className="p-3 mb-3">
              <Text className="text-purple-400 text-xxs font-bold uppercase">Proof submitted — awaiting seller verification.</Text>
              {booking.proofUrl && (
                <Text className="text-surface-300 text-xxs mt-1" numberOfLines={2}>{booking.proofUrl}</Text>
              )}
            </View>
          )}

          {booking.status === 'rejected' && (
            <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 4 }} className="p-3 mb-2">
              <Text className="text-red-400 text-xxs uppercase font-semibold">Booking was rejected by the seller.</Text>
            </View>
          )}

          {booking.status === 'verified' && (
            <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)', borderRadius: 4 }} className="p-3 mb-2">
              <Text className="text-green-400 text-xxs font-bold uppercase">✓ POP Delivery Verified!</Text>
              <Text className="text-surface-300 text-xxs leading-relaxed mt-1">
                Seller has verified your POP delivery! Awaiting seller payout transfer.
              </Text>
            </View>
          )}

          {booking.status === 'payout_submitted' && (
            <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', borderWidth: 1.5, borderColor: 'rgba(99, 102, 241, 0.3)', borderRadius: 4 }} className="p-3 mb-3 gap-2">
              <Text className="text-indigo-400 text-xxs font-bold uppercase">💰 Payout Proof Uploaded by Seller</Text>
              <Text className="text-surface-300 text-xxs leading-4">
                Seller has completed the payout transfer and uploaded the proof. Please review the screenshot below and confirm your receipt.
              </Text>

              {/* Payout Screenshot Preview */}
              {booking.supplierPayoutProof && booking.supplierPayoutProof.length > 0 && (
                <View className="my-1">
                  <Text className="text-white text-xxs font-bold uppercase mb-1">Payout Screenshot:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                    {booking.supplierPayoutProof.map((url, i) => (
                      <TouchableOpacity key={i} onPress={() => onZoomImage(url)} className="mr-2">
                        <Image
                          source={{ uri: url }}
                          style={{ width: 100, height: 100, borderRadius: 4 }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Confirm Receipt Button */}
              <TouchableOpacity
                style={{
                  borderWidth: 1.5,
                  borderColor: '#D4A017',
                  borderRadius: 2,
                  backgroundColor: 'rgba(212, 160, 23, 0.15)',
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
                onPress={() => {
                  if (!request?.buyerOrderId) {
                    Alert.alert('Error', 'No buyer order linked to this booking.');
                    return;
                  }
                  Alert.alert(
                    'Confirm Receipt',
                    'Confirm that you received this payment in your registered payment account? This will mark the booking and order as completed.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Yes, Confirm',
                        onPress: async () => {
                          try {
                            await orderService.supplierConfirmPayout(request.buyerOrderId!);
                            Alert.alert('Success', 'Payout receipt confirmed! Booking completed.');
                          } catch (e) {
                            Alert.alert('Error', e instanceof Error ? e.message : 'Action failed');
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={{ letterSpacing: 0.5 }} className="text-[#D4A017] font-bold text-xxs uppercase">✓ Confirm Payment Received</Text>
              </TouchableOpacity>
            </View>
          )}

          {booking.status === 'completed' && (
            <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)', borderRadius: 4 }} className="p-3 mb-2">
              <Text className="text-green-400 text-xxs font-bold uppercase">✓ Completed — payment received & released.</Text>
            </View>
          )}

          {/* Send POP → Submit proof button */}
          {booking.status === 'accepted' && (
            <TouchableOpacity
              style={{
                borderWidth: 1.5,
                borderColor: '#D4A017',
                borderRadius: 2,
                backgroundColor: 'rgba(212, 160, 23, 0.15)',
                paddingVertical: 12,
                alignItems: 'center',
              }}
              onPress={onSubmitProof}
            >
              <Text style={{ letterSpacing: 0.5 }} className="text-white font-bold text-xxs uppercase">✓ Mark POP Sent & Submit Proof</Text>
            </TouchableOpacity>
          )}

          {/* Direct Order Shortcut */}
          {booking.orderId && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/orders/[id]',
                  params: { id: booking.orderId },
                } as never)
              }
              style={{
                backgroundColor: 'rgba(212, 160, 23, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(212, 160, 23, 0.3)',
                borderRadius: 4,
                paddingVertical: 12,
              }}
              className="items-center justify-center flex-row gap-2 mt-3"
            >
              <Text className="text-[#D4A017] text-sm">📦</Text>
              <Text style={{ letterSpacing: 0.5 }} className="text-[#D4A017] font-bold text-xxs uppercase">View Linked Order & Action Flow</Text>
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
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // Hybrid Flow & Uploading states
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'video' | 'image' }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [sellerWhatsapp, setSellerWhatsapp] = useState<string>('');

  // Input Focus States
  const [urlFocused, setUrlFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  const filtered = bookings.filter((b) => {
    if (filter === 'active') return ['pending', 'accepted', 'in_progress', 'proof_submitted', 'verified', 'payout_submitted'].includes(b.status);
    if (filter === 'completed') return ['completed', 'rejected'].includes(b.status);
    return true;
  });

  const handlePickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos', 'images'],
        quality: 0.85,
        allowsMultipleSelection: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const assets = result.assets.map((asset) => ({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' as const : 'image' as const,
        }));
        setSelectedMedia((prev) => [...prev, ...assets]);
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
    const uploadedUrls: string[] = [];

    // Option A: Upload picked files to Cloudinary
    if (selectedMedia.length > 0) {
      try {
        setUploading(true);
        setProofError(null);
        const folder = `proof-bookings/${proofBooking.id}`;

        for (let i = 0; i < selectedMedia.length; i++) {
          const item = selectedMedia[i];
          const cloudinaryResult = await uploadToCloudinary(
            item.uri,
            folder,
            item.type,
            (progress) => {
              const totalProgress = Math.round(
                ((i * 100) + progress) / selectedMedia.length
              );
              setUploadProgress(totalProgress);
            }
          );
          uploadedUrls.push(cloudinaryResult.secure_url);
        }
        if (uploadedUrls.length > 0) {
          finalProofUrl = uploadedUrls[0];
        }
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
      {
        id: proofBooking.id,
        proofUrl: finalProofUrl,
        proofNotes: proofNotes.trim() || null,
        proofUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      },
      {
        onSuccess: () => {
          setProofBooking(null);
          setProofUrl('');
          setSelectedMedia([]);
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
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      {/* Background Overlay */}
      <TacticalGrid />

      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="px-4 pt-4 pb-3 bg-[#090d16]">
        <Text style={{ letterSpacing: 1 }} className="text-white text-base font-bold uppercase mb-4">My Bookings</Text>
        <View className="flex-row gap-2">
          {([
            { key: 'active' as FilterKey, label: 'Active' },
            { key: 'completed' as FilterKey, label: 'Done' },
            { key: 'all' as FilterKey, label: 'All' },
          ]).map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                borderWidth: 1,
                borderColor: filter === f.key ? '#D4A017' : 'rgba(255,255,255,0.06)',
                backgroundColor: filter === f.key ? 'rgba(212, 160, 23, 0.15)' : 'rgba(30,41,59,0.3)',
                borderRadius: 16,
              }}
              className="px-4.5 py-1.5"
            >
              <Text
                style={{
                  color: filter === f.key ? '#D4A017' : '#94a3b8',
                  fontSize: 10,
                  fontWeight: 'bold',
                  letterSpacing: 0.5,
                }}
                className="uppercase"
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A017" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: 32, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text style={{ letterSpacing: 0.5 }} className="text-surface-300 text-sm mb-1 uppercase">No bookings yet</Text>
              <Text className="text-surface-400 text-xxs uppercase">Browse Requests to start earning</Text>
            </View>
          }
          renderItem={({ item }) => <BookingCard
            booking={item}
            onSubmitProof={() => {
              setProofBooking(item);
              setProofUrl('');
              setSelectedMedia([]);
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
            onZoomImage={setViewerImage}
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
        <View className="flex-1 justify-end bg-black/70">
          <View style={{ backgroundColor: '#090d16', borderTopWidth: 2, borderTopColor: '#D4A017' }} className="p-6 max-h-[85%] relative">
            <CornerReticles />
            <TacticalGrid />

            <Text style={{ letterSpacing: 1 }} className="text-white text-lg font-bold uppercase mb-1">Submit Proof</Text>
            <Text className="text-surface-300 text-xxs mb-5 uppercase leading-relaxed">
              Choose your preferred method to submit delivery proof to the seller.
            </Text>

            <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
              
              {/* Option A: Upload Media */}
              <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
                <Text className="text-[#D4A017] font-bold text-xs uppercase mb-1">Option A: In-App Upload (Primary)</Text>
                <Text className="text-surface-300 text-[10px] uppercase leading-relaxed mb-3">
                  Upload one or more screen recordings or screenshots of the transaction directly.
                </Text>

                {selectedMedia.length > 0 && (
                  <View className="mb-3 gap-2">
                    {selectedMedia.map((item, idx) => (
                      <View key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)', borderRadius: 4 }} className="p-3 flex-row items-center justify-between">
                        <View className="flex-1 mr-2">
                          <Text className="text-green-400 text-[9px] font-bold uppercase mb-0.5">
                            ✓ {item.type === 'video' ? '🎬 Video' : '📸 Image'} #{idx + 1}
                          </Text>
                          <Text className="text-white text-xs" numberOfLines={1}>
                            {item.uri.split('/').pop()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={{
                            borderWidth: 1,
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 2,
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                          }}
                          onPress={() => {
                            setSelectedMedia((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          <Text style={{ letterSpacing: 0.5 }} className="text-red-400 text-[10px] font-bold uppercase">Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(212, 160, 23, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(212, 160, 23, 0.3)',
                    borderRadius: 4,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                  onPress={handlePickFile}
                >
                  <Text style={{ color: '#D4A017', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }} className="uppercase">
                    {selectedMedia.length > 0 ? '➕ Add More Videos/Images' : '📁 Select Videos/Images'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Option B: WhatsApp Fallback */}
              <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
                <Text className="text-green-400 font-bold text-xs uppercase mb-1">Option B: Send via WhatsApp (Fallback)</Text>
                <Text className="text-surface-300 text-[10px] uppercase leading-relaxed mb-3">
                  Open WhatsApp with a pre-filled transaction template and send proof directly to the seller.
                </Text>

                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    borderRadius: 4,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                  onPress={handleSendWhatsApp}
                >
                  <Text className="text-green-400 text-sm">💬</Text>
                  <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }} className="uppercase">Open WhatsApp &amp; Send</Text>
                </TouchableOpacity>
              </View>

              {/* Option C: Paste URL */}
              {selectedMedia.length === 0 && (
                <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4 mb-4">
                  <Text className="text-white font-bold text-xs uppercase mb-1">Option C: Paste External Link</Text>
                  <Text className="text-surface-300 text-[10px] uppercase leading-relaxed mb-3">
                    Paste a link to your screen recording (Google Drive, YouTube, etc.)
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1.5,
                      borderColor: urlFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(30,41,59,0.4)',
                      color: '#fff',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 12,
                    }}
                    value={proofUrl}
                    onChangeText={(v) => { setProofUrl(v); setProofError(null); }}
                    onFocus={() => setUrlFocused(true)}
                    onBlur={() => setUrlFocused(false)}
                    placeholder="https://drive.google.com/..."
                    placeholderTextColor="#475569"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              {/* Notes */}
              <View className="mb-4">
                <Text style={{ letterSpacing: 0.5 }} className="text-surface-300 text-[10px] font-bold uppercase mb-1.5">Notes (optional)</Text>
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: notesFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(30,41,59,0.4)',
                    color: '#fff',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 12,
                    textAlignVertical: 'top',
                  }}
                  value={proofNotes}
                  onChangeText={setProofNotes}
                  onFocus={() => setNotesFocused(true)}
                  onBlur={() => setNotesFocused(false)}
                  placeholder="Any notes or remarks for the seller..."
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Upload Progress */}
              {uploading && (
                <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 4 }} className="p-4 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-white text-xs font-semibold">Uploading proof media...</Text>
                    <Text className="text-[#D4A017] text-xs font-bold">{uploadProgress}%</Text>
                  </View>
                  <View className="bg-surface-200 h-1.5 rounded-full overflow-hidden">
                    <View
                      style={{ width: `${uploadProgress}%`, backgroundColor: '#D4A017' }}
                      className="h-full rounded-full"
                    />
                  </View>
                </View>
              )}

              {proofError && (
                <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                  <Text className="text-red-400 text-xs font-medium">{proofError}</Text>
                </View>
              )}
            </ScrollView>

            <View className="flex-row gap-3 pb-4">
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  borderRadius: 4,
                  backgroundColor: 'rgba(30,41,59,0.4)',
                  paddingVertical: 14,
                }}
                className="flex-1 items-center"
                onPress={() => setProofBooking(null)}
                disabled={uploading || submitting}
              >
                <Text style={{ letterSpacing: 1 }} className="text-white font-bold text-xs uppercase">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderWidth: 1.5,
                  borderColor: '#D4A017',
                  borderRadius: 2,
                  backgroundColor: 'rgba(212, 160, 23, 0.15)',
                  paddingVertical: 14,
                }}
                className="flex-1 items-center"
                onPress={handleSubmitProof}
                disabled={uploading || submitting}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }} className="uppercase">
                  {uploading ? 'Uploading…' : submitting ? 'Submitting…' : 'Submit Proof'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Zoom / Full Screen Image Viewer Modal */}
      <Modal
        visible={!!viewerImage}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <View className="flex-1 bg-black/90 items-center justify-center">
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20 }}
            className="absolute top-10 right-4 px-4 py-2 z-10"
            onPress={() => setViewerImage(null)}
          >
            <Text style={{ letterSpacing: 1 }} className="text-white text-xs font-bold uppercase">Close</Text>
          </TouchableOpacity>
          {viewerImage && (
            <TouchableOpacity activeOpacity={1} onPress={() => setViewerImage(null)}>
              <Image
                source={{ uri: viewerImage }}
                style={{ width: 350, height: 600, borderRadius: 4 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
