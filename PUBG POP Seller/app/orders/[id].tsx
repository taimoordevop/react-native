import * as Clipboard from 'expo-clipboard';
import { Video, ResizeMode } from 'expo-av';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import {
  useOrderLive,
  useUpdateOrderStatus,
  useVerifyAndComplete,
  useConfirmPaymentReceived,
} from '@/features/orders/hooks/useOrders';
import { profileService } from '@/features/profile/services/profileService';
import type { OrderProofVideo, OrderStatus, SellerPaymentDetails } from '@/shared/types';

const CARD_W = Dimensions.get('window').width - 32;

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending_payment: { label: 'Awaiting Payment', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  paid:            { label: 'Paid — Awaiting Start', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  in_progress:     { label: 'In Progress', color: 'text-primary-400', bg: 'bg-primary-500/20' },
  proof_submitted: { label: 'Proof Submitted', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  verified:        { label: 'Verified', color: 'text-green-400', bg: 'bg-green-500/20' },
  completed:       { label: 'Completed ✓', color: 'text-green-400', bg: 'bg-green-500/20' },
  disputed:        { label: 'Disputed', color: 'text-red-400', bg: 'bg-red-500/20' },
  cancelled:       { label: 'Cancelled', color: 'text-surface-300', bg: 'bg-surface-200' },
};

const STATUS_STEPS: OrderStatus[] = [
  'pending_payment', 'paid', 'in_progress', 'proof_submitted', 'verified', 'completed',
];

function StatusTracker({ current }: { current: OrderStatus }) {
  const idx = STATUS_STEPS.indexOf(current);
  return (
    <View className="bg-surface-100 rounded-2xl p-4 mb-4">
      <Text className="text-white font-semibold mb-3">Order Progress</Text>
      {STATUS_STEPS.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const done = i <= idx && idx >= 0 && current !== 'cancelled' && current !== 'disputed';
        return (
          <View key={s} className="flex-row items-center mb-2">
            <View
              className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                done ? 'bg-primary-500' : 'bg-surface-200'
              }`}
            >
              <Text className={`text-xs font-bold ${done ? 'text-white' : 'text-surface-300'}`}>
                {done ? '✓' : String(i + 1)}
              </Text>
            </View>
            <Text className={`text-sm ${done ? 'text-white' : 'text-surface-300'}`}>
              {cfg.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-surface-200">
      <Text className="text-surface-300 text-sm">{label}</Text>
      <Text className="text-white text-sm font-medium">{value}</Text>
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

  // Build unified rows from new methods array OR legacy flat fields
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
    <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-4">
      <Text className="text-yellow-400 font-semibold mb-3">💳 Send Payment To:</Text>
      {rows.map((row, i) => (
        <View
          key={i}
          className={`py-3 ${i < rows.length - 1 ? 'border-b border-yellow-500/10' : ''}`}
        >
          <View className="flex-row items-center mb-1">
            <Text className="text-base mr-2">{METHOD_ICONS[row.type] ?? '💰'}</Text>
            <Text className="text-yellow-300 font-semibold text-sm">{row.type}</Text>
            {row.accountTitle ? (
              <Text className="text-surface-400 text-xs ml-2">({row.accountTitle})</Text>
            ) : null}
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-white font-bold text-base flex-1">{row.accountNumber}</Text>
            <TouchableOpacity
              onPress={() => copy(row.accountNumber, row.type)}
              className="bg-yellow-500/20 rounded-lg px-3 py-1 ml-2"
            >
              <Text className="text-yellow-400 text-xs font-semibold">📋 Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
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
      <Text className={`text-sm font-semibold mb-2 ${color}`}>{label} ({urls.length})</Text>
      <View className="flex-row flex-wrap gap-2">
        {urls.map((url, i) => (
          <TouchableOpacity key={i} onPress={() => onPressImage?.(url)}>
            <Image
              source={{ uri: url }}
              /* eslint-disable-next-line react-native/no-inline-styles */
              style={{ width: 88, height: 88, borderRadius: 10 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text className="text-surface-400 text-xs mt-1">Tap screenshot to view full size</Text>
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
  const videoRef = useRef<Video>(null);
  const isVideo = proof.type === 'video';

  return (
    <View className="bg-surface-200 rounded-2xl overflow-hidden mb-3">
      {isVideo ? (
        <View>
          <Video
            ref={videoRef}
            source={{ uri: proof.url }}
            /* eslint-disable-next-line react-native/no-inline-styles */
            style={{ width: CARD_W, height: CARD_W * 0.56 }}
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
              className="absolute inset-0 items-center justify-center"
            >
              <View className="bg-black/60 rounded-full w-16 h-16 items-center justify-center">
                <Text className="text-white text-2xl">▶</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity onPress={() => onImagePress?.(proof.url)}>
          <Image
            source={{ uri: proof.url }}
            /* eslint-disable-next-line react-native/no-inline-styles */
            style={{ width: CARD_W, height: CARD_W * 0.56 }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Metadata row */}
      <View className="px-4 py-3">
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-purple-400 text-xs font-semibold">
              {isVideo ? '🎬 Video' : '📸 Screenshot'} #{index + 1}
            </Text>
          </View>
          <View className="bg-primary-500/20 rounded-full px-3 py-1">
            <Text className="text-primary-400 text-xs font-bold">
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
  const updateStatus = useUpdateOrderStatus();
  const verifyComplete = useVerifyAndComplete();
  const confirmPayment = useConfirmPaymentReceived();

  const [sellerPayDetails, setSellerPayDetails] = useState<SellerPaymentDetails | null>(null);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!order?.supplierId) return;
    profileService.getById(order.supplierId).then((profile) => {
      setSellerPayDetails(profile?.paymentDetails ?? null);
    });
  }, [order?.supplierId]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#0ea5e9" size="large" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-red-400 text-base text-center mb-4">Order not found.</Text>
        <TouchableOpacity className="bg-surface-100 rounded-xl px-6 py-3" onPress={() => router.back()}>
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isBuyer = user?.uid === order.buyerId;
  const isSeller = user?.uid === order.supplierId; // supplierId on Order = the Seller who accepted the request
  const cfg = STATUS_CONFIG[order.status];
  const supplierNet = order.totalPKR - order.commission;
  const hasBuyerProof = (order.buyerPaymentProof?.length ?? 0) > 0;
  const hasPayoutProof = (order.supplierPayoutProof?.length ?? 0) > 0;

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

  const isMutating = updateStatus.isPending || verifyComplete.isPending || confirmPayment.isPending;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <Modal
        visible={!!fullImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setFullImageUrl(null)}
      >
        <View className="flex-1 bg-black/90 items-center justify-center">
          <TouchableOpacity
            className="absolute top-10 right-4 px-3 py-2 rounded-full bg-black/60"
            onPress={() => setFullImageUrl(null)}
          >
            <Text className="text-white text-sm">Close</Text>
          </TouchableOpacity>
          {fullImageUrl && (
            <TouchableOpacity activeOpacity={1} onPress={() => setFullImageUrl(null)}>
              <Image
                source={{ uri: fullImageUrl }}
                style={{ width: CARD_W, height: CARD_W * 1.4, borderRadius: 12 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">Order Detail</Text>
        <View className={`px-3 py-1 rounded-full ${cfg.bg}`}>
          <Text className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</Text>
        </View>
      </View>

      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Status tracker */}
        {order.status !== 'cancelled' && order.status !== 'disputed' && (
          <StatusTracker current={order.status} />
        )}

        {/* Order summary */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Order Summary</Text>
          <InfoRow label="POP Amount" value={`${order.popAmount.toLocaleString()} POP`} />
          <InfoRow label="Rate / 10k" value={`PKR ${order.agreedRatePer10k}`} />
          <InfoRow label="Total PKR" value={`PKR ${order.totalPKR.toLocaleString()}`} />
          <InfoRow label="Commission" value={`PKR ${order.commission.toLocaleString()}`} />
          <View className="flex-row justify-between pt-2">
            <Text className="text-surface-300 text-sm">Supplier Receives</Text>
            <Text className="text-green-400 text-sm font-bold">
              PKR {supplierNet.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Parties</Text>
          <InfoRow label="Buyer" value={order.buyerName} />
          <InfoRow label="Target PUBG ID" value={order.targetPubgId} />
          <View className="flex-row justify-between pt-2">
            <Text className="text-surface-300 text-sm">Supplier</Text>
            <Text className="text-white text-sm font-medium">{order.supplierName}</Text>
          </View>
        </View>

        {/* —— Payment / Proof screenshots —— */}
        {hasBuyerProof && (
          <View className="bg-surface-100 rounded-2xl p-4 mb-4">
            <ProofImageGrid
              urls={order.buyerPaymentProof}
              label="Buyer Payment Screenshots"
              color="text-yellow-400"
              onPressImage={setFullImageUrl}
            />
          </View>
        )}

        {hasPayoutProof && (
          <View className="bg-surface-100 rounded-2xl p-4 mb-4">
            <ProofImageGrid
              urls={order.supplierPayoutProof}
              label="Payout Proof (Supplier)"
              color="text-green-400"
              onPressImage={setFullImageUrl}
            />
          </View>
        )}

        {/* POP delivery proof (video + screenshots) */}
        {order.proofVideos.length > 0 && (
          <View className="mb-2">
            {/* Header + total diamonds */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-semibold">
                POP Proof ({order.proofVideos.length})
              </Text>
              <View className="bg-purple-500/20 rounded-full px-3 py-1">
                <Text className="text-purple-400 text-xs font-bold">
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
        )}

        {/* ── BUYER ACTIONS ── */}
        {isBuyer && !isSeller && (
          <View className="gap-3">

            {/* Awaiting payment — show seller payment details */}
            {order.status === 'pending_payment' && !hasBuyerProof && (
              <>
                {sellerPayDetails ? (
                  <PaymentDetailsPanel details={sellerPayDetails} />
                ) : (
                  <View className="bg-surface-100 rounded-2xl p-4 mb-2">
                    <Text className="text-surface-300 text-sm">
                      Seller hasn’t added payment details yet. Contact them directly.
                    </Text>
                  </View>
                )}
                <View className="bg-surface-100 rounded-2xl p-3 mb-1">
                  <Text className="text-surface-300 text-xs text-center">
                    Transfer PKR <Text className="text-white font-bold">{order.totalPKR.toLocaleString()}</Text> then upload your screenshot below.
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-primary-500 rounded-2xl py-4 items-center"
                  onPress={() =>
                    router.push({
                      pathname: '/orders/payment-proof-upload',
                      params: { orderId: order.id, mode: 'buyer_payment' },
                    } as never)
                  }
                >
                  <Text className="text-white font-bold text-base">📸 Upload Payment Screenshot</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Proof already uploaded — waiting for seller */}
            {order.status === 'pending_payment' && hasBuyerProof && (
              <View className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                <Text className="text-blue-400 font-semibold mb-1">⏳ Awaiting Seller Confirmation</Text>
                <Text className="text-surface-300 text-sm">
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
                  <Text className="text-primary-400 text-xs">+ Add more screenshots</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* POP proof submitted — buyer verifies */}
            {order.status === 'proof_submitted' && (
              <TouchableOpacity
                className="bg-green-600 rounded-2xl py-4 items-center"
                onPress={handleBuyerVerifyPOP}
                disabled={isMutating}
              >
                {isMutating ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-bold text-base">
                    ✓ I Received POP — Confirm
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {order.status === 'verified' && (
              <View className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                <Text className="text-green-400 font-semibold">✓ POP Verified</Text>
                <Text className="text-surface-300 text-sm mt-1">
                  Seller is processing payout to supplier. Order completes once done.
                </Text>
              </View>
            )}

            {['pending_payment'].includes(order.status) && (
              <TouchableOpacity
                className="bg-red-500/20 border border-red-500/30 rounded-2xl py-3 items-center"
                onPress={handleCancel}
                disabled={isMutating}
              >
                <Text className="text-red-400 font-semibold">Cancel Order</Text>
              </TouchableOpacity>
            )}

            {['in_progress', 'proof_submitted'].includes(order.status) && (
              <TouchableOpacity
                className="bg-orange-500/20 border border-orange-500/30 rounded-2xl py-3 items-center"
                onPress={handleDispute}
                disabled={isMutating}
              >
                <Text className="text-orange-400 font-semibold">Raise Dispute</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── SELLER ACTIONS ── */}
        {isSeller && (
          <View className="gap-3">

            {/* Buyer submitted payment screenshot — seller confirms */}
            {order.status === 'pending_payment' && hasBuyerProof && (
              <>
                <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 mb-1">
                  <Text className="text-yellow-400 text-sm font-semibold mb-1">
                    💰 Buyer submitted payment proof
                  </Text>
                  <Text className="text-surface-300 text-xs">
                    Review the screenshots above then confirm receipt of PKR {order.totalPKR.toLocaleString()}.
                  </Text>
                </View>
                <TouchableOpacity
                  className={`rounded-2xl py-4 items-center ${isMutating ? 'bg-surface-200' : 'bg-green-600'}`}
                  onPress={handleConfirmPayment}
                  disabled={isMutating}
                >
                  {isMutating ? <ActivityIndicator color="#fff" /> : (
                    <Text className="text-white font-bold text-base">✓ Mark Payment Received</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Waiting for buyer to upload payment */}
            {order.status === 'pending_payment' && !hasBuyerProof && (
              <View className="bg-surface-100 rounded-2xl p-4">
                <Text className="text-surface-300 text-sm text-center">
                  ⏳ Waiting for buyer to upload payment screenshot…
                </Text>
              </View>
            )}

            {/* In progress — send POP proof (can add multiple) */}
            {order.status === 'in_progress' && (
              <>
                {order.proofVideos.length > 0 && (
                  <View className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-3 mb-1">
                    <Text className="text-purple-400 text-sm font-semibold">
                      {order.proofVideos.length} proof{order.proofVideos.length > 1 ? 's' : ''} uploaded —{' '}
                      {order.proofVideos.reduce((s, v) => s + (v.diamondsSent ?? 0), 0).toLocaleString()} 💎 recorded
                    </Text>
                    <Text className="text-surface-400 text-xs mt-1">
                      You can add more proofs until fully sent.
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  className="bg-purple-600 rounded-2xl py-4 items-center"
                  onPress={() =>
                    router.push({
                      pathname: '/orders/proof-upload',
                      params: { orderId: order.id },
                    } as never)
                  }
                >
                  <Text className="text-white font-bold text-base">
                    {order.proofVideos.length > 0 ? '+ Add More Proof' : '📹 Upload POP Delivery Proof'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Proof submitted — seller reviews and verifies */}
            {order.status === 'proof_submitted' && (
              <>
                <View className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 mb-1">
                  <Text className="text-purple-400 font-semibold mb-1">
                    🎬 Proof Submitted for Review
                  </Text>
                  <Text className="text-surface-300 text-xs">
                    {order.proofVideos.length} proof{order.proofVideos.length > 1 ? 's' : ''} ·{' '}
                    {order.proofVideos.reduce((s, v) => s + (v.diamondsSent ?? 0), 0).toLocaleString()} 💎 total
                  </Text>
                  <Text className="text-surface-400 text-xs mt-1">
                    Review the videos above, then verify if POP was delivered correctly.
                  </Text>
                </View>
                <TouchableOpacity
                  className={`rounded-2xl py-4 items-center ${isMutating ? 'bg-surface-200' : 'bg-green-600'}`}
                  onPress={handleSellerVerifyProof}
                  disabled={isMutating}
                >
                  {isMutating ? <ActivityIndicator color="#fff" /> : (
                    <Text className="text-white font-bold text-base">✓ Verify Delivery &amp; Release</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-surface-100 rounded-2xl py-3 items-center"
                  onPress={() =>
                    router.push({
                      pathname: '/orders/proof-upload',
                      params: { orderId: order.id },
                    } as never)
                  }
                >
                  <Text className="text-surface-300 text-sm">+ Request More Proof / Add Segment</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Buyer verified POP — seller uploads payout proof to their POP supplier */}
            {order.status === 'verified' && (
              <>
                <View className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3 mb-1">
                  <Text className="text-green-400 font-semibold">✓ POP Delivery Verified by Buyer</Text>
                  <Text className="text-surface-300 text-xs mt-1">
                    Now pay PKR {supplierNet.toLocaleString()} to your POP supplier and upload the screenshot.
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-green-600 rounded-2xl py-4 items-center"
                  onPress={() =>
                    router.push({
                      pathname: '/orders/payment-proof-upload',
                      params: { orderId: order.id, mode: 'seller_payout' },
                    } as never)
                  }
                >
                  <Text className="text-white font-bold text-base">💸 Upload Payout Proof &amp; Complete</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Legacy: order already paid via old flow */}
            {order.status === 'paid' && (
              <TouchableOpacity
                className="bg-primary-500 rounded-2xl py-4 items-center"
                onPress={() => updateStatus.mutate({ id: order.id, status: 'in_progress' })}
                disabled={isMutating}
              >
                {isMutating ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-bold text-base">Start Sending POP</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
