import * as Clipboard from 'expo-clipboard';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import {
  useOrderLive,
  useUpdateOrderStatus,
  useVerifyAndComplete,
  useConfirmPaymentReceived,
  useMarkProofReceivedViaWhatsApp,
  useSupplierConfirmPayout,
  useConfirmSellerPayment,
} from '@/features/orders/hooks/useOrders';
import { orderService } from '@/features/orders/services/orderService';
import { profileService } from '@/features/profile/services/profileService';
import { useLinkedRequest } from '@/features/requests/hooks/useRequests';
import type { Order, OrderProofVideo, OrderStatus, SellerPaymentDetails, UserProfile } from '@/shared/types';

const CARD_W = Dimensions.get('window').width - 32;

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending_payment:  { label: 'Awaiting Payment', color: 'text-yellow-400', bg: 'rgba(234, 179, 8, 0.12)' },
  paid:             { label: 'Paid — Awaiting Start', color: 'text-blue-400', bg: 'rgba(59, 130, 246, 0.12)' },
  in_progress:      { label: 'In Progress', color: 'text-[#D4A017]', bg: 'rgba(212, 160, 23, 0.12)' },
  proof_submitted:  { label: 'Proof Submitted', color: 'text-purple-400', bg: 'rgba(168, 85, 247, 0.12)' },
  verified:         { label: 'Verified', color: 'text-green-400', bg: 'rgba(34, 197, 94, 0.12)' },
  payout_submitted: { label: 'Payout Proof Uploaded', color: 'text-indigo-400', bg: 'rgba(99, 102, 241, 0.12)' },
  completed:        { label: 'Completed', color: 'text-green-400', bg: 'rgba(34, 197, 94, 0.12)' },
  disputed:         { label: 'Disputed', color: 'text-red-400', bg: 'rgba(239, 68, 68, 0.12)' },
  cancelled:        { label: 'Cancelled', color: 'text-surface-300', bg: 'rgba(255, 255, 255, 0.08)' },
};

const STATUS_STEPS: OrderStatus[] = [
  'pending_payment', 'paid', 'in_progress', 'proof_submitted', 'verified', 'payout_submitted', 'completed',
];

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

function StatusTracker({ current }: { current: OrderStatus }) {
  const idx = STATUS_STEPS.indexOf(current);
  return (
    <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
      <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase mb-4">Order Progress</Text>
      {STATUS_STEPS.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const done = i <= idx && idx >= 0 && current !== 'cancelled' && current !== 'disputed';
        return (
          <View key={s} className="flex-row items-center mb-3">
            <View
              style={{
                borderWidth: 1,
                borderColor: done ? '#D4A017' : 'rgba(255,255,255,0.15)',
                backgroundColor: done ? 'rgba(212, 160, 23, 0.12)' : 'transparent',
              }}
              className="w-5 h-5 rounded-full items-center justify-center mr-3"
            >
              <Text className={`text-[10px] font-bold ${done ? 'text-[#D4A017]' : 'text-surface-300'}`}>
                {done ? '✓' : String(i + 1)}
              </Text>
            </View>
            <Text className={`text-xs font-medium uppercase ${done ? 'text-white' : 'text-surface-300'}`}>
              {cfg.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-white/5">
      <Text className="text-surface-300 text-xs">{label}</Text>
      <Text className={`text-xs font-semibold ${valueColor ?? 'text-white'}`}>{value}</Text>
    </View>
  );
}

const METHOD_ICONS: Partial<Record<string, string>> = {
  JazzCash: '💳',
  EasyPaisa: '📱',
  'Bank Transfer': '🏦',
  SadaPay: '💜',
  NayaPay: '🟢',
};

function PaymentDetailsPanel({ details }: { details: SellerPaymentDetails }) {
  const copy = async (val: string, label: string) => {
    await Clipboard.setStringAsync(val);
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  type Row = { type: string; accountNumber: string; accountTitle?: string };
  let rows: Row[] = [];
  if (details.methods && details.methods.length > 0) {
    rows = details.methods.map((m) => ({
      type: m.type,
      accountNumber: m.accountNumber,
      accountTitle: m.accountTitle,
    }));
  } else {
    if (details.jazzCash) rows.push({ type: 'JazzCash', accountNumber: details.jazzCash });
    if (details.easyPaisa) rows.push({ type: 'EasyPaisa', accountNumber: details.easyPaisa });
    if (details.bankAccount) rows.push({ type: 'Bank Transfer', accountNumber: details.bankAccount, accountTitle: details.bankName });
  }

  if (rows.length === 0) return null;

  return (
    <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)', borderWidth: 1.5, borderColor: 'rgba(212, 160, 23, 0.35)', borderRadius: 4 }} className="p-4 mb-4">
      <Text style={{ letterSpacing: 0.5 }} className="text-yellow-400 font-bold text-xs uppercase mb-3">💳 Send Payment To:</Text>
      {rows.map((row, i) => (
        <View
          key={i}
          className={`py-3 ${i < rows.length - 1 ? 'border-b border-yellow-500/10' : ''}`}
        >
          <View className="flex-row items-center mb-1">
            <Text className="text-base mr-2">{METHOD_ICONS[row.type] ?? '💰'}</Text>
            <Text className="text-[#D4A017] font-bold text-xs">{row.type}</Text>
            {row.accountTitle ? (
              <Text className="text-surface-400 text-xxs ml-2 font-medium">({row.accountTitle})</Text>
            ) : null}
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-white font-bold text-sm flex-1">{row.accountNumber}</Text>
            <TouchableOpacity
              onPress={() => copy(row.accountNumber, row.type)}
              style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.1)', borderRadius: 2 }}
              className="px-3 py-1.5 ml-2"
            >
              <Text className="text-[#D4A017] text-[10px] font-bold uppercase">📋 Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

function hasPaymentMethods(details: SellerPaymentDetails | null | undefined): boolean {
  if (!details) return false;
  if (details.methods && details.methods.length > 0) return true;
  if (details.jazzCash || details.easyPaisa || details.bankAccount) return true;
  return false;
}

function ProofImageGrid({
  urls,
  label,
  color,
  onPressImage,
}: {
  urls: string[];
  label: string;
  color: string;
  onPressImage?: (url: string) => void;
}) {
  if (!urls || urls.length === 0) return null;
  return (
    <View className="mb-4">
      <Text style={{ letterSpacing: 0.5 }} className={`text-xs font-bold uppercase mb-2 ${color}`}>{label} ({urls.length})</Text>
      <View className="flex-row flex-wrap gap-2">
        {urls.map((url, i) => (
          <TouchableOpacity key={i} onPress={() => onPressImage?.(url)}>
            <Image
              source={{ uri: url }}
              style={{ width: 88, height: 88, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text className="text-surface-400 text-[10px] uppercase mt-1.5">Tap screenshot to view full size</Text>
    </View>
  );
}

function ProofVideoCard({
  proof,
  index,
  onImagePress,
}: {
  proof: OrderProofVideo;
  index: number;
  onImagePress?: (url: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const videoRef = useRef<Video>(null);
  const isVideo = proof.type === 'video';

  const optimizedUrl = isVideo && proof.url.includes('res.cloudinary.com')
    ? proof.url.replace('/video/upload/', '/video/upload/q_auto,vc_h264,f_mp4/')
    : proof.url;

  const posterUri = isVideo ? (proof.url.includes('res.cloudinary.com') ? proof.url.replace('/video/upload/', '/video/upload/f_jpg,so_1/').replace(/\.[^/.]+$/, '.jpg') : undefined) : undefined;

  const handlePlay = async () => {
    setPlaying(true);
    if (videoRef.current) {
      try {
        await videoRef.current.playAsync();
      } catch (err) {
        console.error('Failed to trigger playAsync:', err);
      }
    }
  };

  const downloadVideo = async () => {
    try {
      setDownloading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need storage permission to save the video to your gallery.');
        setDownloading(false);
        return;
      }

      const filename = `POP_Proof_${Date.now()}.mp4`;
      const localUri = FileSystem.documentDirectory + filename;
      const { uri } = await FileSystem.downloadAsync(proof.url, localUri);

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success ✓', 'Video saved to your gallery.');
    } catch (err) {
      console.error(err);
      Alert.alert('Download Failed', 'Could not save the video. Please check your connection.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="overflow-hidden mb-3 relative">
      {isVideo ? (
        <View>
          <Video
            ref={videoRef}
            source={{ uri: optimizedUrl }}
            style={{ width: CARD_W, height: CARD_W * 0.56 }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay={playing}
            isLooping={false}
            usePoster={!!posterUri}
            posterSource={posterUri ? { uri: posterUri } : undefined}
            posterStyle={{ resizeMode: 'cover' }}
            progressUpdateIntervalMillis={1000}
            onPlaybackStatusUpdate={(s) => {
              if ('didJustFinish' in s && s.didJustFinish) setPlaying(false);
            }}
          />
          {!playing && (
            <TouchableOpacity
              onPress={handlePlay}
              className="absolute inset-0 items-center justify-center bg-black/20"
            >
              <View className="bg-black/60 rounded-full w-16 h-16 items-center justify-center">
                <Text className="text-white text-2xl ml-1">▶</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={downloadVideo}
            disabled={downloading}
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}
            className="absolute top-2.5 right-2.5 px-2.5 py-1.5 flex-row items-center"
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white text-[10px] font-bold uppercase">📥 Save Video</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => onImagePress?.(proof.url)}>
          <Image
            source={{ uri: proof.url }}
            style={{ width: CARD_W, height: CARD_W * 0.56 }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Metadata */}
      <View className="px-4 py-3">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-[#D4A017] text-xs font-bold uppercase">
            {isVideo ? '🎬 Video' : '📸 Screenshot'} #{index + 1}
          </Text>
          <View style={{ backgroundColor: 'rgba(212,160,23,0.12)', borderRadius: 2 }} className="px-3 py-1">
            <Text className="text-[#D4A017] text-[10px] font-bold uppercase">
              {proof.diamondsSent?.toLocaleString() ?? '?'} 💎 sent
            </Text>
          </View>
        </View>
        {proof.notes ? (
          <Text className="text-surface-300 text-xs mt-1">{proof.notes}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { order, isLoading } = useOrderLive(id);
  const { data: linkedRequest } = useLinkedRequest(id);
  const updateStatus = useUpdateOrderStatus();
  const verifyComplete = useVerifyAndComplete();
  const confirmPayment = useConfirmPaymentReceived();
  const markProofWhatsApp = useMarkProofReceivedViaWhatsApp();
  const supplierConfirmPayout = useSupplierConfirmPayout();
  const confirmSellerPayment = useConfirmSellerPayment();

  const [sellerPayDetails, setSellerPayDetails] = useState<SellerPaymentDetails | null>(null);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [recentBuyers, setRecentBuyers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const targetSupplierId = order?.popSupplierId || order?.supplierId;
    if (!targetSupplierId) return;
    profileService.getById(targetSupplierId).then((profile: UserProfile | null) => {
      setSellerPayDetails(profile?.paymentDetails ?? null);
    });
  }, [order?.supplierId, order?.popSupplierId]);

  useEffect(() => {
    if (!order?.supplierId) return;
    orderService.getBySupplier(order.supplierId).then((ordersList: Order[]) => {
      const uniqueBuyers = new Map<string, string>();
      if (order.buyerId && order.buyerName) {
        uniqueBuyers.set(order.buyerId, order.buyerName);
      }
      ordersList.forEach((o: Order) => {
        if (o.buyerId && o.buyerName) {
          uniqueBuyers.set(o.buyerId, o.buyerName);
        }
      });
      const list = Array.from(uniqueBuyers.entries()).map(([buyerUid, name]) => ({ id: buyerUid, name }));
      setRecentBuyers(list);
    }).catch(() => {});
  }, [order?.supplierId, order?.buyerId, order?.buyerName]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#090d16] items-center justify-center">
        <ActivityIndicator color="#D4A017" size="large" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-[#090d16] items-center justify-center px-6">
        <Text className="text-red-400 text-sm font-semibold uppercase text-center mb-4">Order not found.</Text>
        <TouchableOpacity
          style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.1)', borderRadius: 2 }}
          className="px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-[#D4A017] font-bold text-xs uppercase">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isBuyer = user?.uid === order.buyerId;
  const isSeller = user?.uid === order.supplierId;
  const isPopSupplier = order.popSupplierId ? user?.uid === order.popSupplierId : false;
  const cfg = STATUS_CONFIG[order.status];
  const supplierNet = order.totalPKR - order.commission;
  const hasBuyerProof = (order.buyerPaymentProof?.length ?? 0) > 0;
  const hasPayoutProof = !isBuyer && (order.supplierPayoutProof?.length ?? 0) > 0;

  const confirmAction = (title: string, msg: string, onConfirm: () => void) => {
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: onConfirm },
    ]);
  };

  const handleCancel = () =>
    confirmAction(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      () => updateStatus.mutate({ id: order.id, status: 'cancelled' }),
    );

  const handleDispute = () =>
    confirmAction(
      'Raise Dispute',
      'Raise a dispute with the platform admin?',
      () => updateStatus.mutate({ id: order.id, status: 'disputed' }),
    );

  const handleBuyerVerifyPOP = () =>
    confirmAction(
      'Confirm POP Received?',
      'Confirm you received the POP in-game. This releases the order for completion.',
      () => verifyComplete.mutate(order.id),
    );

  const handleSellerVerifyProof = () =>
    confirmAction(
      'Verify Delivery?',
      `Review the ${order.proofVideos.length} proof(s) above. Mark as verified to proceed to payout?`,
      () => verifyComplete.mutate(order.id),
    );

  const handleConfirmPayment = () =>
    confirmAction(
      'Mark Payment Received',
      'Confirm you received the payment from the buyer?',
      () => confirmPayment.mutate(order.id),
    );

  const handleMarkProofWhatsApp = () =>
    confirmAction(
      'Mark WhatsApp Proof Received',
      'Confirm you received the popularity delivery proof from the supplier via WhatsApp fallback?',
      () => markProofWhatsApp.mutate(order.id),
    );

  const handleSupplierConfirmPayout = () =>
    confirmAction(
      'Confirm Payment Received?',
      `Confirm you received PKR ${supplierNet.toLocaleString()} in your account. This completes the order.`,
      () => supplierConfirmPayout.mutate(order.id),
    );

  const handleForwardToBuyer = async (buyerId: string, buyerName: string) => {
    try {
      const profile = await profileService.getById(buyerId);
      const whatsappNum = profile?.whatsappNumber;

      if (!whatsappNum) {
        Alert.alert(
          'WhatsApp Number Missing',
          `${buyerName} has not added their WhatsApp number. Instruct them to add it under Profile > Contact & Storage.`,
        );
        return;
      }

      const targetVideos = (order.verifiedProofVideos && order.verifiedProofVideos.length > 0)
        ? order.verifiedProofVideos
        : order.proofVideos;

      const videoLinks = targetVideos
        .map((pv, idx) => `*Proof #${idx + 1} (${pv.type}):* ${pv.url}`)
        .join('\n');

      const message = `*PUBG POP DELIVERY PROOF (FORWARDED)*
----------------------------------------
Hello ${buyerName}!
Your PUBG popularity delivery has been processed by the seller.

*Order Details:*
- *Order ID:* ${order.id}
- *Amount:* ${order.popAmount.toLocaleString()} POP
- *Delivery Method:* ${order.proofMethod === 'whatsapp' ? 'WhatsApp Fallback' : 'In-App Secure Upload'}

${videoLinks ? `*Uploaded Proof Links:*\n${videoLinks}` : '*Notice:* Proof has been submitted via WhatsApp fallback and is being validated.'}

Please check your PUBG game and open the app to click *I Received POP — Confirm* to complete the order!`;

      const cleanPhone = whatsappNum.replace(/[^0-9]/g, '');
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        setForwardModalVisible(false);
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate WhatsApp forwarding message.');
    }
  };

  const isMutating =
    updateStatus.isPending ||
    verifyComplete.isPending ||
    confirmPayment.isPending ||
    markProofWhatsApp.isPending;

  return (
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      <TacticalGrid />
      <CornerReticles />

      <Modal
        visible={!!fullImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setFullImageUrl(null)}
      >
        <View className="flex-1 bg-black/90 items-center justify-center">
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.1)', borderRadius: 2 }}
            className="absolute top-10 right-4 px-3 py-2"
            onPress={() => setFullImageUrl(null)}
          >
            <Text className="text-[#D4A017] text-xs font-bold uppercase">Close</Text>
          </TouchableOpacity>
          {fullImageUrl && (
            <TouchableOpacity activeOpacity={1} onPress={() => setFullImageUrl(null)}>
              <Image
                source={{ uri: fullImageUrl }}
                style={{ width: CARD_W, height: CARD_W * 1.4, borderRadius: 4 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-[#D4A017] text-base font-bold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold flex-1 uppercase">Order Detail</Text>
        <View style={{ backgroundColor: cfg.bg, borderRadius: 2 }} className="px-3 py-1">
          <Text style={{ letterSpacing: 0.5 }} className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Status tracker */}
        {order.status !== 'cancelled' && order.status !== 'disputed' && (
          <StatusTracker current={order.status} />
        )}

        {/* Order summary */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
          <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase mb-3">Order Summary</Text>
          <InfoRow label="POP Amount" value={`${order.popAmount.toLocaleString()} POP`} />
          <InfoRow label="Rate / 10k" value={`PKR ${order.agreedRatePer10k}`} />
          <InfoRow label="Total PKR" value={`PKR ${order.totalPKR.toLocaleString()}`} />
          <InfoRow label="Commission" value={`PKR ${order.commission.toLocaleString()}`} />
          <View className="flex-row justify-between pt-2.5">
            <Text className="text-surface-300 text-xs">Supplier Receives</Text>
            <Text className="text-green-400 text-xs font-bold">
              PKR {supplierNet.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Linked Supplier Request (Seller only) */}
        {isSeller && linkedRequest && (
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.25)', borderRadius: 4 }} className="p-4 mb-4">
            <Text style={{ letterSpacing: 0.5 }} className="text-green-400 text-xs font-bold uppercase mb-3">Linked Supplier Request</Text>
            <InfoRow label="Supplier Rate" value={`PKR ${linkedRequest.ratePer10k}/10k`} />
            <InfoRow 
              label="Your Margin (Commission)" 
              value={`PKR ${(linkedRequest.buyerRatePer10k ?? order.agreedRatePer10k) - linkedRequest.ratePer10k}/10k`} 
              valueColor="text-green-400 font-bold"
            />
            <View className="flex-row justify-between pt-2.5 border-t border-white/5 mt-2">
              <Text className="text-surface-300 text-xs">Projected Net Profit</Text>
              <Text className="text-[#D4A017] text-xs font-bold">
                PKR {Math.max(0, Math.round((order.popAmount / 10000) * ((linkedRequest.buyerRatePer10k ?? order.agreedRatePer10k) - linkedRequest.ratePer10k) - order.commission)).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Parties */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
          <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase mb-3">Parties</Text>
          <InfoRow label="Buyer" value={order.buyerName} />
          <InfoRow label="Target PUBG ID" value={order.targetPubgId} />
          <View className="flex-row justify-between pt-2.5">
            <Text className="text-surface-300 text-xs">Supplier</Text>
            <Text className="text-white text-xs font-semibold">{order.supplierName}</Text>
          </View>
        </View>

        {/* Payment / Proof screenshots */}
        {order.isDirectRequest && order.sellerPaymentProof && order.sellerPaymentProof.length > 0 && (
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
            <ProofImageGrid
              urls={order.sellerPaymentProof}
              label="Seller Payment Proof Screenshots"
              color="text-indigo-400"
              onPressImage={setFullImageUrl}
            />
          </View>
        )}

        {hasBuyerProof && (
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
            <ProofImageGrid
              urls={order.buyerPaymentProof}
              label="Buyer Payment Screenshots"
              color="text-yellow-400"
              onPressImage={setFullImageUrl}
            />
          </View>
        )}

        {hasPayoutProof && (
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
            <ProofImageGrid
              urls={order.supplierPayoutProof}
              label="Payout Proof (Supplier)"
              color="text-green-400"
              onPressImage={setFullImageUrl}
            />
          </View>
        )}

        {/* POP delivery proof (video + screenshots) */}
        {isBuyer && !isSeller ? (
          order.proofStatus === 'verified' && order.verifiedProofVideos && order.verifiedProofVideos.length > 0 ? (
            <View className="mb-2">
              <View className="flex-row justify-between items-center mb-1">
                <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase">
                  POP Proof ({order.verifiedProofVideos.length})
                </Text>
                <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)' }} className="rounded px-2.5 py-0.5">
                  <Text className="text-purple-400 text-[10px] font-bold uppercase">✓ VERIFIED BY SELLER</Text>
                </View>
              </View>
              <Text className="text-surface-400 text-xxs mb-3 uppercase">
                ✨ These proofs have been verified by the Seller.
              </Text>
              {order.verifiedProofVideos.map((v, i) => (
                <ProofVideoCard key={i} proof={v} index={i} onImagePress={setFullImageUrl} />
              ))}
            </View>
          ) : order.proofVideos.length > 0 ? (
            <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.05)', borderWidth: 1.5, borderColor: 'rgba(168, 85, 247, 0.25)', borderRadius: 4 }} className="p-4 mb-4">
              <Text style={{ letterSpacing: 0.5 }} className="text-purple-400 text-xs font-bold uppercase mb-1">⏳ POP Proof Uploaded</Text>
              <Text className="text-surface-300 text-xs leading-relaxed">
                Supplier has submitted the POP delivery proofs. Waiting for the Seller to verify and approve them. They will appear here once verified.
              </Text>
            </View>
          ) : null
        ) : (
          order.proofVideos.length > 0 && (
            <View className="mb-2">
              {order.proofStatus === 'verified' && (
                <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', borderWidth: 1.5, borderColor: 'rgba(34, 197, 94, 0.25)', borderRadius: 4 }} className="p-4 mb-3 flex-row items-center gap-3">
                  <Text className="text-xl">✅</Text>
                  <View className="flex-1">
                    <Text className="text-green-400 text-sm font-bold">POP Proofs Verified</Text>
                    <Text className="text-surface-300 text-xs mt-0.5">
                      These proofs have been approved and are now visible to the Buyer inside the app.
                    </Text>
                  </View>
                </View>
              )}
              <View className="flex-row justify-between items-center mb-3">
                <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase">
                  POP Proof ({order.proofVideos.length})
                </Text>
                <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', borderRadius: 2 }} className="px-3 py-1">
                  <Text className="text-purple-400 text-[10px] font-bold uppercase">
                    {order.proofVideos
                      .reduce((sum, v) => sum + (v.diamondsSent ?? 0), 0)
                      .toLocaleString()}
                    {' '}💎 total
                  </Text>
                </View>
              </View>
              {order.proofVideos.map((v, i) => (
                <ProofVideoCard key={i} proof={v} index={i} onImagePress={setFullImageUrl} />
              ))}
            </View>
          )
        )}

        {/* ── BUYER ACTIONS ── */}
        {isBuyer && !isSeller && (
          <View className="gap-3">
            {order.status === 'pending_payment' && !hasBuyerProof && (
              <>
                {sellerPayDetails && hasPaymentMethods(sellerPayDetails) ? (
                  <PaymentDetailsPanel details={sellerPayDetails} />
                ) : (
                  <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-2">
                    <Text className="text-surface-300 text-xs">
                      Seller hasn’t added payment details yet. Contact them directly.
                    </Text>
                  </View>
                )}
                <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-3 mb-1">
                  <Text className="text-surface-300 text-xs text-center">
                    Transfer PKR <Text className="text-white font-bold">{order.totalPKR.toLocaleString()}</Text> then upload your screenshot below.
                  </Text>
                </View>
                <TouchableOpacity
                  style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                  className="py-4 items-center"
                  onPress={() =>
                    router.push({
                      pathname: '/orders/payment-proof-upload',
                      params: { orderId: order.id, mode: 'buyer_payment' },
                    } as never)
                  }
                >
                  <Text className="text-[#D4A017] font-bold text-xs uppercase">📸 Upload Payment Screenshot</Text>
                </TouchableOpacity>
              </>
            )}

            {order.status === 'pending_payment' && hasBuyerProof && (
              <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderWidth: 1.5, borderColor: 'rgba(59, 130, 246, 0.25)', borderRadius: 4 }} className="p-4">
                <Text style={{ letterSpacing: 0.5 }} className="text-blue-400 font-bold text-xs uppercase mb-1">⏳ Awaiting Seller Confirmation</Text>
                <Text className="text-surface-300 text-xs leading-relaxed">
                  Your payment screenshot was submitted. The seller will confirm receipt and start the order.
                </Text>
                <TouchableOpacity
                  className="mt-3 py-2 items-center"
                  onPress={() =>
                    router.push({
                      pathname: '/orders/payment-proof-upload',
                      params: { orderId: order.id, mode: 'buyer_payment' },
                    } as never)
                  }
                >
                  <Text className="text-[#D4A017] text-xxs font-bold uppercase">+ Add more screenshots</Text>
                </TouchableOpacity>
              </View>
            )}

            {order.status === 'proof_submitted' && (
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 2 }}
                className="py-4 items-center"
                onPress={handleBuyerVerifyPOP}
                disabled={isMutating}
              >
                {isMutating ? <ActivityIndicator color="#22c55e" /> : (
                  <Text className="text-[#22c55e] font-bold text-xs uppercase">
                    ✓ I Received POP — Confirm
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {order.status === 'verified' && (
              <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', borderWidth: 1.5, borderColor: 'rgba(34, 197, 94, 0.25)', borderRadius: 4 }} className="p-4">
                <Text style={{ letterSpacing: 0.5 }} className="text-green-400 font-bold text-xs uppercase">✓ POP Verified</Text>
                <Text className="text-surface-300 text-xs mt-1 leading-relaxed">
                  Seller is processing payout to supplier. Order completes once done.
                </Text>
              </View>
            )}

            {['pending_payment'].includes(order.status) && (
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 2 }}
                className="py-3.5 items-center"
                onPress={handleCancel}
                disabled={isMutating}
              >
                <Text style={{ color: '#ef4444' }} className="font-bold text-xs uppercase">Cancel Order</Text>
              </TouchableOpacity>
            )}

            {['in_progress', 'proof_submitted'].includes(order.status) && (
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: 2 }}
                className="py-3.5 items-center"
                onPress={handleDispute}
                disabled={isMutating}
              >
                <Text style={{ color: '#f97316' }} className="font-bold text-xs uppercase">Raise Dispute</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── SELLER ACTIONS ── */}
        {isSeller && (
          <View className="gap-3">
            {order.isDirectRequest ? (
              <>
                {order.status === 'pending_payment' && (
                  <>
                    {(!order.sellerPaymentProof || order.sellerPaymentProof.length === 0) ? (
                      <>
                        {sellerPayDetails && hasPaymentMethods(sellerPayDetails) ? (
                          <PaymentDetailsPanel details={sellerPayDetails} />
                        ) : (
                          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-2">
                            <Text className="text-surface-300 text-xs">
                              Supplier hasn’t added payment details yet. Contact them directly.
                            </Text>
                          </View>
                        )}
                        <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)', borderWidth: 1.5, borderColor: 'rgba(212, 160, 23, 0.25)', borderRadius: 4 }} className="p-3 mb-1">
                          <Text className="text-[#D4A017] text-xxs font-semibold text-center uppercase">
                            Transfer PKR <Text className="text-white font-bold">{order.totalPKR.toLocaleString()}</Text> then upload your screenshot below.
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={{ borderWidth: 1.5, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.15)', borderRadius: 2 }}
                          className="py-4 items-center"
                          onPress={() =>
                            router.push({
                              pathname: '/orders/payment-proof-upload',
                              params: { orderId: order.id, mode: 'seller_payment' },
                            } as never)
                          }
                          disabled={isMutating}
                        >
                          {isMutating ? <ActivityIndicator color="#6366f1" /> : (
                            <Text className="text-[#6366f1] font-bold text-xs uppercase">📸 Upload Payment to Supplier</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderWidth: 1.5, borderColor: 'rgba(59, 130, 246, 0.25)', borderRadius: 4 }} className="p-4">
                        <Text style={{ letterSpacing: 0.5 }} className="text-blue-400 font-bold text-xs uppercase mb-1">⏳ Awaiting Supplier Confirmation</Text>
                        <Text className="text-surface-300 text-xs leading-relaxed">
                          Your payment screenshot was submitted. The supplier will confirm receipt shortly.
                        </Text>
                        <TouchableOpacity
                          className="mt-3 py-2 items-center"
                          onPress={() =>
                            router.push({
                              pathname: '/orders/payment-proof-upload',
                              params: { orderId: order.id, mode: 'seller_payment' },
                            } as never)
                          }
                          disabled={isMutating}
                        >
                          <Text className="text-[#D4A017] text-xxs font-bold uppercase">+ Add more screenshots</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                {order.status === 'in_progress' && (
                  <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4">
                    <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase mb-1">⏳ Supplier is Preparing POP</Text>
                    <Text className="text-surface-300 text-xs leading-relaxed">
                      The supplier has confirmed receipt of your payment and is preparing the POP delivery.
                    </Text>
                  </View>
                )}

                {order.status === 'proof_submitted' && (
                  <TouchableOpacity
                    style={{ borderWidth: 1.5, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 2 }}
                    className="py-4 items-center"
                    onPress={handleSellerVerifyProof}
                    disabled={isMutating}
                  >
                    {isMutating ? <ActivityIndicator color="#22c55e" /> : (
                      <Text className="text-[#22c55e] font-bold text-xs uppercase">✓ Verify POP Delivery &amp; Complete</Text>
                    )}
                  </TouchableOpacity>
                )}

                {order.status === 'completed' && (
                  <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', borderWidth: 1.5, borderColor: 'rgba(34, 197, 94, 0.25)', borderRadius: 4 }} className="p-4 mb-2">
                    <Text style={{ letterSpacing: 0.5 }} className="text-green-400 font-bold text-xs uppercase mb-1">✓ Order Completed</Text>
                    <Text className="text-surface-300 text-xs leading-relaxed">
                      This direct order has been successfully completed and the POP has been verified.
                    </Text>
                    <TouchableOpacity
                      style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                      className="py-3.5 items-center justify-center mt-4"
                      onPress={() =>
                        router.push({
                          pathname: '/(seller)/log-manual-deal',
                          params: {
                            popAmount: String(order.popAmount),
                            supplierRate: String(order.agreedRatePer10k),
                            description: `Direct Request Order #${order.id.slice(-6).toUpperCase()} completed`,
                            orderId: order.id,
                          },
                        } as never)
                      }
                    >
                      <Text className="text-[#D4A017] font-bold text-xs uppercase">📝 Log Profit in Analytics</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <>
                {['paid', 'in_progress'].includes(order.status) && (
                  <TouchableOpacity
                    style={{ borderWidth: 1.5, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 2 }}
                    className="py-4 items-center flex-row justify-center gap-2 mb-2"
                    onPress={() =>
                      router.push({
                        pathname: '/(seller)/post-request',
                        params: {
                          buyerOrderId: order.id,
                          buyerPubgId: order.targetPubgId,
                          popAmount: String(order.popAmount),
                          rate: String(order.agreedRatePer10k),
                        },
                      } as never)
                    }
                  >
                    <Text className="text-[#22c55e] font-bold text-xs uppercase">🏪 Create Supplier Request</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'pending_payment' && hasBuyerProof && (
                  <>
                    <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)', borderWidth: 1.5, borderColor: 'rgba(212, 160, 23, 0.25)', borderRadius: 4 }} className="p-3 mb-1">
                      <Text style={{ letterSpacing: 0.5 }} className="text-yellow-400 text-xs font-bold uppercase mb-1">
                        💰 Buyer submitted payment proof
                      </Text>
                      <Text className="text-surface-300 text-xs">
                        Review the screenshots above then confirm receipt of PKR {order.totalPKR.toLocaleString()}.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{ borderWidth: 1.5, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 2 }}
                      className="py-4 items-center"
                      onPress={handleConfirmPayment}
                      disabled={isMutating}
                    >
                      {isMutating ? <ActivityIndicator color="#22c55e" /> : (
                        <Text className="text-[#22c55e] font-bold text-xs uppercase">✓ Mark Payment Received</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {order.status === 'pending_payment' && !hasBuyerProof && (
                  <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4">
                    <Text className="text-surface-300 text-xs text-center uppercase font-medium">
                      ⏳ Waiting for buyer to upload payment screenshot…
                    </Text>
                  </View>
                )}

                {order.status === 'in_progress' && (
                  <View className="gap-3">
                    {order.proofVideos.length > 0 && (
                      <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.05)', borderWidth: 1.5, borderColor: 'rgba(168, 85, 247, 0.25)', borderRadius: 4 }} className="p-3 mb-1">
                        <Text style={{ letterSpacing: 0.5 }} className="text-purple-400 text-xs font-bold uppercase">
                          {order.proofVideos.length} proof{order.proofVideos.length > 1 ? 's' : ''} uploaded —{' '}
                          {order.proofVideos.reduce((s, v) => s + (v.diamondsSent ?? 0), 0).toLocaleString()} 💎 recorded
                        </Text>
                        <Text className="text-surface-400 text-xxs uppercase mt-1">
                          You can add more proofs until fully sent.
                        </Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={{ borderWidth: 1.5, borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.15)', borderRadius: 2 }}
                      className="py-4 items-center"
                      onPress={() =>
                        router.push({
                          pathname: '/orders/proof-upload',
                          params: { orderId: order.id },
                        } as never)
                      }
                    >
                      <Text className="text-[#a855f7] font-bold text-xs uppercase">
                        {order.proofVideos.length > 0 ? '+ Add More Proof' : '📹 Upload POP Delivery Proof'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ borderWidth: 1.5, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 2 }}
                      className="py-4 items-center flex-row justify-center gap-2"
                      onPress={handleMarkProofWhatsApp}
                      disabled={isMutating}
                    >
                      <Text className="text-[#22c55e] font-bold text-xs uppercase">Mark Proof Received via WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'proof_submitted' && (
                  <View className="gap-3">
                    <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.05)', borderWidth: 1.5, borderColor: 'rgba(168, 85, 247, 0.25)', borderRadius: 4 }} className="p-4 mb-1">
                      <Text style={{ letterSpacing: 0.5 }} className="text-purple-400 text-xs font-bold uppercase mb-1">
                        🎬 Proof Submitted for Review
                      </Text>
                      {order.proofMethod === 'whatsapp' ? (
                        <Text className="text-green-400 text-xxs font-bold uppercase mb-1">
                          ✓ Received via WhatsApp Fallback
                        </Text>
                      ) : (
                        <Text className="text-surface-300 text-xxs uppercase">
                          {order.proofVideos.length} proof{order.proofVideos.length > 1 ? 's' : ''} ·{' '}
                          {order.proofVideos.reduce((s, v) => s + (v.diamondsSent ?? 0), 0).toLocaleString()} 💎 total
                        </Text>
                      )}
                      <Text className="text-surface-400 text-xxs mt-1 leading-relaxed">
                        {order.proofStatus === 'verified'
                          ? 'POP delivery has been successfully verified. Buyer can now see proofs inside the app.'
                          : 'Review the proof details, then verify if POP was delivered correctly.'}
                      </Text>
                    </View>

                    {order.proofStatus !== 'verified' ? (
                      <>
                        <TouchableOpacity
                          style={{ borderWidth: 1.5, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 2 }}
                          className="py-4 items-center"
                          onPress={handleSellerVerifyProof}
                          disabled={isMutating}
                        >
                          {isMutating ? <ActivityIndicator color="#22c55e" /> : (
                            <Text className="text-[#22c55e] font-bold text-xs uppercase">✓ Verify Delivery &amp; Release</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                          className="py-4 items-center flex-row justify-center gap-2"
                          onPress={() => setForwardModalVisible(true)}
                        >
                          <Text className="text-[#D4A017] font-bold text-xs uppercase">Forward Proof to Buyer</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={{ borderWidth: 1.5, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 2 }}
                          className="py-4 items-center flex-row justify-center gap-2"
                          onPress={() => handleForwardToBuyer(order.buyerId, order.buyerName)}
                        >
                          <Text className="text-[#22c55e] font-bold text-xs uppercase">Share Proof with Buyer via WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.1)', borderRadius: 2 }}
                          className="py-4 items-center flex-row justify-center gap-2"
                          onPress={() => setForwardModalVisible(true)}
                        >
                          <Text className="text-[#D4A017] font-bold text-xs uppercase">Forward to other Buyers</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {order.proofStatus !== 'verified' && (
                      <TouchableOpacity
                        style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}
                        className="py-3 items-center"
                        onPress={() =>
                          router.push({
                            pathname: '/orders/proof-upload',
                            params: { orderId: order.id },
                          } as never)
                        }
                      >
                        <Text className="text-surface-300 text-xxs font-bold uppercase">+ Request More Proof / Add Segment</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {order.status === 'verified' && (
                  <View className="gap-3">
                    <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', borderWidth: 1.5, borderColor: 'rgba(34, 197, 94, 0.25)', borderRadius: 4 }} className="p-3">
                      <Text style={{ letterSpacing: 0.5 }} className="text-green-400 font-bold text-xs uppercase">✓ POP Delivery Verified by Buyer</Text>
                      <Text className="text-surface-300 text-xs mt-1 leading-relaxed">
                        Now pay PKR {supplierNet.toLocaleString()} to your POP supplier and upload the screenshot.
                      </Text>
                    </View>

                    {sellerPayDetails && hasPaymentMethods(sellerPayDetails) ? (
                      <PaymentDetailsPanel details={sellerPayDetails} />
                    ) : (
                      <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4">
                        <Text className="text-surface-300 text-xs leading-relaxed text-center font-medium uppercase">
                          {"⚠️ The Supplier has not registered their payment details yet. Ask them to add details in Profile > Contact & Storage."}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={{ borderWidth: 1.5, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 2 }}
                      className="py-4 items-center"
                      onPress={() =>
                        router.push({
                          pathname: '/orders/payment-proof-upload',
                          params: { orderId: order.id, mode: 'seller_payout' },
                        } as never)
                      }
                    >
                      <Text className="text-[#22c55e] font-bold text-xs uppercase">💸 Upload Payout Proof</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                      className="py-4 items-center flex-row justify-center gap-2"
                      onPress={() => handleForwardToBuyer(order.buyerId, order.buyerName)}
                    >
                      <Text className="text-[#D4A017] font-bold text-xs uppercase">Share Proof with Buyer via WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'payout_submitted' && (
                  <View className="gap-3">
                    <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)', borderWidth: 1.5, borderColor: 'rgba(99, 102, 241, 0.25)', borderRadius: 4 }} className="p-4">
                      <Text style={{ letterSpacing: 0.5 }} className="text-indigo-400 font-bold text-xs uppercase mb-1">⏳ Awaiting Supplier Confirmation</Text>
                      <Text className="text-surface-300 text-xs leading-relaxed">
                        You have successfully uploaded the payout proof. The Supplier has been notified to verify the payment receipt. Once they confirm, the order will finalize and both will get their money.
                      </Text>
                    </View>

                    {order.supplierPayoutProof && order.supplierPayoutProof.length > 0 && (
                      <View className="mb-2">
                        <Text className="text-white text-xs font-bold uppercase mb-2">Your Uploaded Payout Proof:</Text>
                        {order.supplierPayoutProof.map((url, i) => (
                          <TouchableOpacity key={i} onPress={() => setFullImageUrl(url)}>
                            <Image
                              source={{ uri: url }}
                              style={{ width: CARD_W, height: CARD_W * 0.56, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {order.status === 'paid' && (
                  <TouchableOpacity
                    style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                    className="py-4 items-center"
                    onPress={() => updateStatus.mutate({ id: order.id, status: 'in_progress' })}
                    disabled={isMutating}
                  >
                    {isMutating ? <ActivityIndicator color="#D4A017" /> : (
                      <Text className="text-[#D4A017] font-bold text-xs uppercase">Start Sending POP</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* ── SUPPLIER ACTIONS ── */}
        {isPopSupplier && !isSeller && (
          <View className="gap-3">
            {order.isDirectRequest ? (
              <>
                {order.status === 'pending_payment' && (
                  <>
                    {(!order.sellerPaymentProof || order.sellerPaymentProof.length === 0) ? (
                      <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4">
                        <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase mb-1">⏳ Waiting for Seller's Payment</Text>
                        <Text className="text-surface-300 text-xs leading-relaxed">
                          The seller needs to upload payment proof to proceed.
                        </Text>
                      </View>
                    ) : (
                      <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)', borderWidth: 1.5, borderColor: 'rgba(212, 160, 23, 0.25)', borderRadius: 4 }} className="p-4">
                        <Text style={{ letterSpacing: 0.5 }} className="text-yellow-400 font-bold text-xs uppercase mb-2">💰 Confirm Payment Received?</Text>
                        <Text className="text-surface-300 text-xs leading-relaxed mb-4">
                          Verify the payment screenshot below matches your account balance.
                        </Text>
                        <TouchableOpacity
                          style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                          className="py-3.5 items-center justify-center"
                          onPress={() =>
                            confirmAction(
                              'Confirm Payment Received',
                              'Are you sure you received payment from the seller?',
                              () => confirmSellerPayment.mutate(order.id),
                            )
                          }
                          disabled={isMutating}
                        >
                          {isMutating ? <ActivityIndicator color="#D4A017" /> : (
                            <Text className="text-[#D4A017] font-bold text-xs uppercase">✓ Confirm Payment Received</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                {order.status === 'in_progress' && (
                  <TouchableOpacity
                    style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                    className="py-4 items-center"
                    onPress={() =>
                      router.push({
                        pathname: '/orders/proof-upload',
                        params: { orderId: order.id },
                      } as never)
                    }
                    disabled={isMutating}
                  >
                    <Text className="text-[#D4A017] font-bold text-xs uppercase">📹 Upload POP Delivery Proof</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'proof_submitted' && (
                  <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4">
                    <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase mb-1">⏳ Awaiting Seller Verification</Text>
                    <Text className="text-surface-300 text-xs leading-relaxed">
                      You have submitted the POP delivery proofs. The seller will verify them shortly to complete the deal.
                    </Text>
                  </View>
                )}

                {order.status === 'completed' && (
                  <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', borderWidth: 1.5, borderColor: 'rgba(34, 197, 94, 0.25)', borderRadius: 4 }} className="p-4">
                    <Text style={{ letterSpacing: 0.5 }} className="text-green-400 font-bold text-xs uppercase mb-1">✓ Order Completed</Text>
                    <Text className="text-surface-300 text-xs leading-relaxed">
                      This direct request has been completed and marked as verified.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {order.status === 'verified' && (
                  <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.05)', borderWidth: 1.5, borderColor: 'rgba(168, 85, 247, 0.25)', borderRadius: 4 }} className="p-4">
                    <Text style={{ letterSpacing: 0.5 }} className="text-purple-400 text-xs font-bold uppercase mb-1">⏳ Awaiting Seller Payout</Text>
                    <Text className="text-surface-300 text-xs leading-relaxed">
                      The Seller has verified your POP delivery! The Seller will now transfer PKR {supplierNet.toLocaleString()} to your registered payment details and upload the payout proof.
                    </Text>
                  </View>
                )}

                {order.status === 'payout_submitted' && (
                  <View className="gap-3">
                    <View style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)', borderWidth: 1.5, borderColor: 'rgba(212, 160, 23, 0.25)', borderRadius: 4 }} className="p-4 mb-1">
                      <Text style={{ letterSpacing: 0.5 }} className="text-yellow-400 text-xs font-bold uppercase mb-1">
                        💰 Payout Proof Submitted
                      </Text>
                      <Text className="text-surface-300 text-xs leading-relaxed">
                        The Seller has uploaded transaction proof for your payout of PKR {supplierNet.toLocaleString()}.
                      </Text>
                      <Text className="text-surface-400 text-xxs mt-2 uppercase font-semibold">
                        Review the payout proof and your account details below. Confirm you received the amount to complete the deal.
                      </Text>
                    </View>

                    {sellerPayDetails && (
                      <View className="mb-2">
                        <Text className="text-white text-xs font-bold uppercase mb-2">Your Payment Details used by Seller:</Text>
                        <PaymentDetailsPanel details={sellerPayDetails} />
                      </View>
                    )}

                    {order.supplierPayoutProof && order.supplierPayoutProof.length > 0 && (
                      <View className="mb-2">
                        <Text className="text-white text-xs font-bold uppercase mb-2">Seller's Payout Proof Screenshot(s):</Text>
                        {order.supplierPayoutProof.map((url, i) => (
                          <TouchableOpacity key={i} onPress={() => setFullImageUrl(url)} className="mb-2">
                            <Image
                              source={{ uri: url }}
                              style={{ width: CARD_W, height: CARD_W * 0.56, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      style={{ borderWidth: 1.5, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 2 }}
                      className="py-4 items-center"
                      onPress={handleSupplierConfirmPayout}
                      disabled={supplierConfirmPayout.isPending}
                    >
                      {supplierConfirmPayout.isPending ? <ActivityIndicator color="#22c55e" /> : (
                        <Text className="text-[#22c55e] font-bold text-xs uppercase">✓ Confirm Payment Received</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Forward Proof Modal */}
      <Modal
        visible={forwardModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setForwardModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View style={{ backgroundColor: '#090d16', borderTopWidth: 2, borderTopColor: '#D4A017' }} className="p-6 max-h-[70%]">
            <Text className="text-white text-base font-bold uppercase mb-1">Forward POP Proof</Text>
            <Text className="text-surface-300 text-xs mb-6">
              Select which Buyer associated with this request to forward the pre-filled proof text to via WhatsApp.
            </Text>

            <ScrollView className="mb-6">
              {recentBuyers.length === 0 ? (
                <View className="bg-surface-100 rounded-2xl p-4 items-center">
                  <Text className="text-surface-300 text-xs text-center">No buyers found.</Text>
                </View>
              ) : (
                recentBuyers.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={{ backgroundColor: 'rgba(30,41,59,0.25)', borderWidth: 1, borderColor: 'rgba(212,160,23,0.15)', borderRadius: 4 }}
                    className="flex-row items-center justify-between p-4 mb-3"
                    onPress={() => handleForwardToBuyer(b.id, b.name)}
                  >
                    <View className="flex-row items-center gap-3">
                      <View style={{ backgroundColor: 'rgba(212,160,23,0.12)' }} className="w-10 h-10 rounded-full items-center justify-center border border-[#D4A017]">
                        <Text className="text-[#D4A017] font-bold text-xs">👤</Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold text-sm">{b.name}</Text>
                        <Text className="text-surface-300 text-[10px] uppercase mt-0.5">{b.id === order.buyerId ? 'Current Buyer (Primary)' : 'Recent Buyer'}</Text>
                      </View>
                    </View>
                    <Text className="text-[#D4A017] text-xs font-bold uppercase">Forward →</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}
              className="py-4 items-center"
              onPress={() => setForwardModalVisible(false)}
            >
              <Text className="text-white font-bold text-xs uppercase font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
