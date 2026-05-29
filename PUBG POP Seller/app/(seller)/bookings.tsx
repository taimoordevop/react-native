import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import {
  useSellerBookings,
  useUpdateBookingStatus,
} from '@/features/requests/hooks/useRequests';
import type { Booking, BookingStatus } from '@/shared/types';

type TabKey = 'pending' | 'accepted' | 'proof_submitted' | 'completed' | 'all';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'accepted', label: 'Active', icon: '⚡' },
  { key: 'proof_submitted', label: 'To Verify', icon: '🔍' },
  { key: 'completed', label: 'Done', icon: '✅' },
  { key: 'all', label: 'All', icon: '📋' },
];

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:         { label: 'Pending Approval', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  accepted:        { label: 'Active Delivery', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  in_progress:     { label: 'In Progress', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  rejected:        { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  proof_submitted: { label: 'Proof Submitted', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  completed:       { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

export default function SellerBookingsScreen() {
  const { user } = useAuthStore();
  const { bookings, isLoading } = useSellerBookings(user?.uid);
  const { mutate: updateBooking, isPending: updating } = useUpdateBookingStatus();

  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Accept modal state
  const [acceptTarget, setAcceptTarget] = useState<Booking | null>(null);
  const [buyerPubgId, setBuyerPubgId] = useState('');

  // Proof viewer state
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleCopyId = async (id: string, label: string) => {
    await Clipboard.setStringAsync(id);
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  const handleBookingAction = (booking: Booking, status: BookingStatus) => {
    Alert.alert(
      status === 'rejected' ? 'Reject Booking' : 'Complete Booking',
      status === 'rejected'
        ? `Are you sure you want to reject ${booking.supplierName}'s booking of ${booking.bookedAmount.toLocaleString()} POP?`
        : `Verify and mark ${booking.supplierName}'s booking as completed? This will finalize the deal.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'rejected' ? 'Reject' : 'Complete',
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: () => {
            updateBooking(
              { id: booking.id, status },
              {
                onSuccess: () => {
                  Alert.alert('Success', `Booking status updated to ${status}.`);
                },
                onError: (e) => {
                  Alert.alert('Error', e instanceof Error ? e.message : 'Action failed');
                },
              },
            );
          },
        },
      ],
    );
  };

  const handleAcceptSubmit = () => {
    if (!acceptTarget) return;
    if (!buyerPubgId.trim()) {
      Alert.alert('Error', 'Please enter the Buyer PUBG ID so the supplier knows where to send POP.');
      return;
    }

    updateBooking(
      {
        id: acceptTarget.id,
        status: 'accepted',
        buyerPubgId: buyerPubgId.trim(),
      },
      {
        onSuccess: () => {
          setAcceptTarget(null);
          setBuyerPubgId('');
          Alert.alert('Booking Accepted!', 'Supplier has been notified and given the PUBG ID to send POP.');
        },
        onError: (e) => {
          Alert.alert('Error', e instanceof Error ? e.message : 'Acceptance failed');
        },
      },
    );
  };

  // Stats calculation
  const counts = {
    pending: bookings.filter((b) => b.status === 'pending').length,
    accepted: bookings.filter((b) => b.status === 'accepted').length,
    proof_submitted: bookings.filter((b) => b.status === 'proof_submitted').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    all: bookings.length,
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    return b.status === activeTab;
  });

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isExpanded = expandedId === item.id;
    const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: 'text-white', bg: 'bg-surface-200' };

    return (
      <View className="bg-surface-100 rounded-2xl mb-3 border border-surface-200 overflow-hidden">
        <TouchableOpacity
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.9}
          className="p-4"
        >
          {/* Header Status Row */}
          <View className="flex-row items-center justify-between mb-3">
            <View className={`px-2.5 py-1 rounded-full border ${cfg.bg}`}>
              <Text className={`text-xs font-bold capitalize ${cfg.color}`}>
                {cfg.label}
              </Text>
            </View>
            <Text className="text-surface-400 text-xs">
              {item.createdAt?.toDate?.()?.toLocaleDateString() ?? 'Recent'}
            </Text>
          </View>

          {/* Amount and Supplier */}
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-white text-xl font-bold">
              {item.bookedAmount.toLocaleString()} POP
            </Text>
            <Text className="text-yellow-500 font-semibold text-sm">
              Supplier: {item.supplierName}
            </Text>
          </View>

          {/* Rate and Time */}
          <View className="flex-row justify-between items-center">
            <Text className="text-surface-300 text-xs">
              Delivery: <Text className="text-white font-medium">{item.deliveryTime === 'instant' ? '⚡ Instant' : `🕐 ${item.deliveryTime}`}</Text>
            </Text>
            {item.supplierPubgId && (
              <Text className="text-surface-400 text-xs">
                Supplier ID: <Text className="text-white">{item.supplierPubgId}</Text>
              </Text>
            )}
          </View>

          {/* Quick indicators */}
          {!isExpanded && (
            <View className="mt-3 pt-2 border-t border-surface-200/50 flex-row justify-between items-center">
              <Text className="text-surface-400 text-xs">▼ Tap to see actions & proof details</Text>
              {item.status === 'proof_submitted' && (
                <View className="bg-purple-500/20 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <Text className="text-purple-400 text-[10px] font-bold">VERIFY PROOF</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Expanded View */}
        {isExpanded && (
          <View className="bg-surface-200/40 p-4 border-t border-surface-200">
            {/* Attached Buyer PUBG ID Info */}
            {item.buyerPubgId && (
              <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
                <Text className="text-blue-400 text-xs font-semibold mb-1">POP Target (Buyer PUBG ID):</Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-bold text-base" selectable>
                    {item.buyerPubgId}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleCopyId(item.buyerPubgId!, 'Buyer PUBG ID')}
                    className="bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30"
                  >
                    <Text className="text-blue-400 text-xs font-bold">📋 Copy ID</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Proof Submissions */}
            {item.status === 'proof_submitted' && item.proofUrl && (
              <View className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-4">
                <Text className="text-purple-400 text-xs font-semibold mb-2">Supplier POP Proof:</Text>
                {item.proofUrl.startsWith('http') && (
                  <TouchableOpacity
                    onPress={() => setViewerImage(item.proofUrl)}
                    activeOpacity={0.9}
                    className="mb-2 relative rounded-lg overflow-hidden bg-black aspect-video items-center justify-center border border-purple-500/20"
                  >
                    <Image
                      source={{ uri: item.proofUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <View className="absolute bg-black/60 px-3 py-1.5 rounded-full">
                      <Text className="text-white text-xs font-bold">🔍 Tap to Zoom Image</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {item.proofNotes && (
                  <Text className="text-surface-300 text-xs leading-relaxed bg-surface-100 p-2 rounded-lg border border-surface-200/30">
                    <Text className="font-semibold text-purple-400">Notes: </Text>
                    {item.proofNotes}
                  </Text>
                )}
              </View>
            )}

            {/* Timestamps */}
            <View className="space-y-1 mb-4">
              <View className="flex-row justify-between">
                <Text className="text-surface-400 text-xs">Request ID:</Text>
                <Text className="text-surface-300 text-xs font-mono">{item.requestId.slice(0, 10)}...</Text>
              </View>
              {item.completedAt && (
                <View className="flex-row justify-between">
                  <Text className="text-surface-400 text-xs">Completed:</Text>
                  <Text className="text-surface-300 text-xs">{(item.completedAt as any)?.toDate?.()?.toLocaleString() ?? 'Recent'}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2 mt-2">
              {item.status === 'pending' && (
                <>
                  <TouchableOpacity
                    onPress={() => handleBookingAction(item, 'rejected')}
                    className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl py-3.5 items-center justify-center"
                    disabled={updating}
                  >
                    <Text className="text-red-400 font-semibold text-sm">❌ Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setBuyerPubgId('');
                      setAcceptTarget(item);
                    }}
                    className="flex-[2] bg-yellow-500 rounded-xl py-3.5 items-center justify-center"
                    disabled={updating}
                  >
                    <Text className="text-slate-950 font-bold text-sm">✓ Accept & Attach PUBG</Text>
                  </TouchableOpacity>
                </>
              )}

              {item.status === 'proof_submitted' && (
                <TouchableOpacity
                  onPress={() => handleBookingAction(item, 'completed')}
                  className="flex-1 bg-green-600 rounded-xl py-3.5 items-center justify-center"
                  disabled={updating}
                >
                  <Text className="text-white font-bold text-sm">✓ Verify & Complete Deal</Text>
                </TouchableOpacity>
              )}

              {item.status === 'accepted' && (
                <View className="flex-1 bg-surface-100 p-3 rounded-xl border border-surface-200">
                  <Text className="text-center text-surface-400 text-xs">
                    ⏳ Waiting for supplier to send POP and upload delivery proof.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-surface-100 rounded-lg">
          <Text className="text-yellow-500 font-bold text-base">←</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">Supplier Bookings</Text>
        <View className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full">
          <Text className="text-yellow-500 text-xs font-bold">Seller Desk</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-4 py-3 border-b border-surface-200/50">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <View className="flex-row gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = counts[tab.key];

              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2.5 flex-row items-center gap-1.5 border ${
                    isActive
                      ? 'bg-yellow-500 border-yellow-400'
                      : 'bg-surface-100 border-surface-200'
                  }`}
                >
                  <Text className="text-xs">{tab.icon}</Text>
                  <Text
                    className={`text-xs font-bold ${
                      isActive ? 'text-slate-950' : 'text-surface-300'
                    }`}
                  >
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View
                      className={`rounded-full px-1.5 py-0.5 min-w-[18px] items-center justify-center ${
                        isActive ? 'bg-slate-900' : 'bg-surface-200'
                      }`}
                    >
                      <Text
                        className={`text-[9px] font-black ${
                          isActive ? 'text-yellow-400' : 'text-surface-400'
                        }`}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* List Container */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#eab308" size="large" />
          <Text className="text-surface-400 text-xs mt-2">Syncing with blockchain/database...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#eab308" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24 px-8">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-white text-base font-bold mb-2">No bookings found</Text>
              <Text className="text-surface-400 text-sm text-center">
                {activeTab === 'pending'
                  ? 'Great job! You have no pending bookings from suppliers awaiting your review.'
                  : activeTab === 'proof_submitted'
                  ? 'Excellent! No delivery proofs are pending verification.'
                  : 'Bookings matching this status will appear here.'}
              </Text>
            </View>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        />
      )}

      {/* Accept Booking Modal — Capture Buyer PUBG ID */}
      <Modal
        visible={!!acceptTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setAcceptTarget(null)}
      >
        <View className="flex-1 justify-end bg-black/75">
          <View className="bg-surface rounded-t-3xl p-6 border-t border-surface-200">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">Attach Buyer PUBG ID</Text>
              <TouchableOpacity onPress={() => setAcceptTarget(null)} className="p-1">
                <Text className="text-surface-400 text-base font-black">✕</Text>
              </TouchableOpacity>
            </View>

            {acceptTarget && (
              <View className="bg-surface-100 p-4 rounded-2xl mb-4 border border-surface-200">
                <Text className="text-white text-sm font-semibold mb-1">
                  Booking by {acceptTarget.supplierName}
                </Text>
                <Text className="text-yellow-500 font-bold text-lg">
                  {acceptTarget.bookedAmount.toLocaleString()} POP
                </Text>
                <Text className="text-surface-400 text-xs mt-1">
                  Once accepted, the supplier will be given the PUBG ID below to send these POP units directly.
                </Text>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-surface-300 text-sm mb-2">Target Buyer PUBG ID *</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base border border-surface-200"
                value={buyerPubgId}
                onChangeText={setBuyerPubgId}
                placeholder="Enter Buyer's numerical PUBG ID"
                placeholderTextColor="#475569"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              onPress={handleAcceptSubmit}
              className="bg-yellow-500 rounded-xl py-4 items-center justify-center mb-2"
            >
              <Text className="text-slate-950 font-bold text-base">✓ Accept & Send to Supplier</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Zoomable Image Viewer Modal */}
      <Modal
        visible={!!viewerImage}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <View className="flex-1 bg-black/95 justify-center items-center p-4">
          <TouchableOpacity
            onPress={() => setViewerImage(null)}
            className="absolute top-12 right-6 bg-surface-100/80 p-3 rounded-full border border-surface-200 z-10"
          >
            <Text className="text-white font-bold">✕ Close</Text>
          </TouchableOpacity>

          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              className="w-full h-4/5"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
