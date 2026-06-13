import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { approvalService } from '@/features/profile/services/approvalService';
import type { SellerApprovalRequest } from '@/shared/types';

export default function SellerApprovalsScreen() {
  const [requests, setRequests] = useState<SellerApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Note inputs keyed by requestId
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  
  // Full-screen image zoom modal
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await approvalService.getPendingApprovals();
      setRequests(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load pending approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProcess = async (userId: string, status: 'approved' | 'rejected') => {
    const notes = decisionNotes[userId] || '';
    if (status === 'rejected' && !notes.trim()) {
      Alert.alert('Notes Required', 'Please provide a reason/notes for rejecting this Seller.');
      return;
    }

    try {
      setProcessingId(userId);
      await approvalService.processApproval(userId, status, notes.trim());
      
      Alert.alert(
        'Success',
        `Seller request has been ${status === 'approved' ? 'approved' : 'rejected'} successfully.`,
        [{ text: 'OK', onPress: () => fetchRequests() }]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update approval status.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1">Seller Verification Queue</Text>
        <TouchableOpacity onPress={fetchRequests} disabled={loading} className="px-2">
          <Text className="text-primary-400 text-sm">{loading ? '...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#8b5cf6" size="large" />
        </View>
      ) : requests.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-5xl mb-4">🛡️</Text>
          <Text className="text-white text-lg font-bold text-center">All Caught Up!</Text>
          <Text className="text-surface-300 text-sm text-center mt-2 leading-5">
            There are currently no pending Seller approval requests in the queue.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {requests.map((req) => {
            const isProcessing = processingId === req.userId;
            const currentNotes = decisionNotes[req.userId] || '';
            
            return (
              <View
                key={req.id}
                className="bg-surface-100 border border-surface-200 rounded-2xl p-4 mb-4"
              >
                {/* User Info */}
                <View className="mb-4">
                  <Text className="text-white font-bold text-base">{req.userName}</Text>
                  <Text className="text-surface-300 text-xs mt-0.5">{req.userEmail}</Text>
                  <View className="flex-row items-center gap-1.5 mt-2 bg-yellow-500/10 self-start px-2 py-0.5 rounded-full border border-yellow-500/20">
                    <Text className="text-yellow-400 text-xs font-semibold">CNIC: {req.cnicNumber}</Text>
                  </View>
                </View>

                {/* Selfie Proof */}
                <Text className="text-surface-300 text-xs mb-2 font-semibold">Selfie holding CNIC:</Text>
                <TouchableOpacity
                  onPress={() => setZoomImage(req.cnicSelfieUrl)}
                  activeOpacity={0.9}
                  className="rounded-xl overflow-hidden mb-4 bg-black"
                >
                  <Image
                    source={{ uri: req.cnicSelfieUrl }}
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-lg">
                    <Text className="text-white text-xxs">🔍 Tap to Zoom</Text>
                  </View>
                </TouchableOpacity>

                {/* Notes Input */}
                <View className="mb-4">
                  <Text className="text-surface-300 text-xs mb-2 font-semibold">
                    Decision Notes / Rejection Reason:
                  </Text>
                  <TextInput
                    value={currentNotes}
                    onChangeText={(text) =>
                      setDecisionNotes((prev) => ({ ...prev, [req.userId]: text }))
                    }
                    placeholder="Enter approval details or rejection reasons here..."
                    placeholderTextColor="#475569"
                    className="bg-surface text-white rounded-xl px-3 py-3 text-sm"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    style={{ minHeight: 60 }}
                  />
                </View>

                {/* Actions */}
                {isProcessing ? (
                  <ActivityIndicator color="#8b5cf6" size="small" className="py-2" />
                ) : (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => handleProcess(req.userId, 'approved')}
                      className="flex-1 bg-green-600 rounded-xl py-3 items-center"
                    >
                      <Text className="text-white font-bold text-sm">Approve Seller</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleProcess(req.userId, 'rejected')}
                      className="flex-1 bg-red-600/20 border border-red-500/30 rounded-xl py-3 items-center"
                    >
                      <Text className="text-red-400 font-bold text-sm">Reject Request</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Full-screen Zoom Image Modal */}
      <Modal visible={!!zoomImage} transparent animationType="fade" onRequestClose={() => setZoomImage(null)}>
        <View className="flex-1 bg-black justify-center items-center">
          {zoomImage && (
            <Image
              source={{ uri: zoomImage }}
              className="w-full h-5/6"
              resizeMode="contain"
            />
          )}
          <TouchableOpacity
            onPress={() => setZoomImage(null)}
            className="absolute top-12 right-6 bg-surface-100 p-3 rounded-full border border-surface-200"
          >
            <Text className="text-white font-bold text-sm">✕ Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
