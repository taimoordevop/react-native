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

export default function SellerApprovalsScreen() {
  const [requests, setRequests] = useState<SellerApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
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
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      <TacticalGrid />
      <CornerReticles />

      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-[#D4A017] text-base font-bold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold flex-1 uppercase">Seller Verification</Text>
        <TouchableOpacity onPress={fetchRequests} disabled={loading} className="px-2">
          <Text className="text-[#D4A017] text-xs font-bold uppercase">{loading ? '...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#D4A017" size="large" />
        </View>
      ) : requests.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-4xl mb-4">🛡️</Text>
          <Text className="text-white text-sm font-bold text-center uppercase mb-2">All Caught Up!</Text>
          <Text className="text-surface-300 text-xs text-center mt-2 leading-relaxed uppercase font-medium">
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
                style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }}
                className="p-4 mb-4"
              >
                {/* User Info */}
                <View className="mb-4">
                  <Text className="text-white font-bold text-base uppercase">{req.userName}</Text>
                  <Text className="text-surface-300 text-xs mt-0.5">{req.userEmail}</Text>
                  <View style={{ backgroundColor: 'rgba(212,160,23,0.12)', borderRadius: 2 }} className="flex-row items-center mt-3 self-start px-2.5 py-0.5">
                    <Text className="text-[#D4A017] text-[10px] font-bold uppercase">CNIC: {req.cnicNumber}</Text>
                  </View>
                </View>

                {/* Selfie Proof */}
                <Text className="text-surface-300 text-[10px] uppercase font-bold mb-2">Selfie holding CNIC:</Text>
                <TouchableOpacity
                  onPress={() => setZoomImage(req.cnicSelfieUrl)}
                  activeOpacity={0.9}
                  style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}
                  className="overflow-hidden mb-4 bg-black"
                >
                  <Image
                    source={{ uri: req.cnicSelfieUrl }}
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 2 }} className="absolute bottom-2 right-2 px-2 py-1">
                    <Text className="text-white text-[9px] uppercase font-bold">🔍 Tap to Zoom</Text>
                  </View>
                </TouchableOpacity>

                {/* Notes Input */}
                <View className="mb-4">
                  <Text className="text-surface-300 text-[10px] uppercase font-bold mb-2">
                    Decision Notes / Rejection Reason:
                  </Text>
                  <TextInput
                    value={currentNotes}
                    onChangeText={(text) =>
                      setDecisionNotes((prev) => ({ ...prev, [req.userId]: text }))
                    }
                    placeholder="Enter approval details or rejection reasons here..."
                    placeholderTextColor="#475569"
                    style={{ minHeight: 60, backgroundColor: 'rgba(30,41,59,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}
                    className="text-white px-3 py-3 text-xs"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>

                {/* Actions */}
                {isProcessing ? (
                  <ActivityIndicator color="#D4A017" size="small" className="py-2" />
                ) : (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => handleProcess(req.userId, 'approved')}
                      style={{ borderWidth: 1.5, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: 2 }}
                      className="flex-1 py-3 items-center"
                    >
                      <Text className="text-[#22c55e] font-bold text-xs uppercase">Approve Seller</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleProcess(req.userId, 'rejected')}
                      style={{ borderWidth: 1.5, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 2 }}
                      className="flex-1 py-3 items-center"
                    >
                      <Text className="text-[#ef4444] font-bold text-xs uppercase">Reject Request</Text>
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
            style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.1)', borderRadius: 2 }}
            className="absolute top-12 right-6 p-3"
          >
            <Text className="text-[#D4A017] font-bold text-xs uppercase">✕ Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
