import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTION } from '@/constants';
import type { UserProfile, UserRole } from '@/shared/types';

const ROLE_BADGE: Record<UserRole, { bg: string; text: string }> = {
  buyer:    { bg: 'rgba(59, 130, 246, 0.12)',   text: 'text-blue-400' },
  supplier: { bg: 'rgba(34, 197, 94, 0.12)',  text: 'text-green-400' },
  seller:   { bg: 'rgba(234, 179, 8, 0.12)', text: 'text-yellow-400' },
  admin:    { bg: 'rgba(168, 85, 247, 0.12)', text: 'text-purple-400' },
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

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionUid, setActionUid] = useState<string | null>(null);

  // Search input focus state
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, COLLECTION.USERS), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserProfile);
      setUsers(data);
      setFiltered(data);
    } catch (e) {
      console.error('[Admin] Failed to fetch users:', e);
      Alert.alert('Error', 'Failed to retrieve user catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    const lower = text.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          (u.displayName ?? '').toLowerCase().includes(lower) ||
          (u.email ?? '').toLowerCase().includes(lower) ||
          (u.pubgId ?? '').toLowerCase().includes(lower),
      ),
    );
  };

  const handleToggleBlock = async (userItem: UserProfile) => {
    const actionLabel = userItem.isBanned ? 'Unblock' : 'Block';
    Alert.alert(
      `${actionLabel} User?`,
      `Are you sure you want to ${actionLabel.toLowerCase()} ${userItem.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setActionUid(userItem.uid);
              const targetBan = !userItem.isBanned;
              await updateDoc(doc(db, COLLECTION.USERS, userItem.uid), {
                isBanned: targetBan,
              });

              // Update local state
              const updatedUsers = users.map((u) =>
                u.uid === userItem.uid ? { ...u, isBanned: targetBan } : u
              );
              setUsers(updatedUsers);
              setFiltered(
                updatedUsers.filter(
                  (u) =>
                    (u.displayName ?? '').toLowerCase().includes(search.toLowerCase()) ||
                    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
                    (u.pubgId ?? '').toLowerCase().includes(search.toLowerCase()),
                ),
              );

              Alert.alert('Success', `User ${userItem.displayName} has been ${targetBan ? 'blocked' : 'unblocked'}.`);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Action failed');
            } finally {
              setActionUid(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (userItem: UserProfile) => {
    Alert.alert(
      'DELETE USER?',
      `Are you absolutely sure you want to delete ${userItem.displayName}? This will permanently remove their profile data. This action cannot be undone!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE PERMANENTLY',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionUid(userItem.uid);
              await deleteDoc(doc(db, COLLECTION.USERS, userItem.uid));

              // Update local state
              const updatedUsers = users.filter((u) => u.uid !== userItem.uid);
              setUsers(updatedUsers);
              setFiltered(
                updatedUsers.filter(
                  (u) =>
                    (u.displayName ?? '').toLowerCase().includes(search.toLowerCase()) ||
                    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
                    (u.pubgId ?? '').toLowerCase().includes(search.toLowerCase()),
                ),
              );

              Alert.alert('Deleted', `User ${userItem.displayName} profile has been permanently removed.`);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Delete failed');
            } finally {
              setActionUid(null);
            }
          },
        },
      ]
    );
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
        <Text className="text-white text-base font-bold uppercase">Manage Users</Text>
        <Text style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="px-2 py-0.5 ml-auto text-[#D4A017] text-[10px] font-bold uppercase">
          {users.length} Total
        </Text>
      </View>

      {/* Search */}
      <View className="px-4 py-3">
        <TextInput
          style={{
            borderWidth: 1.5,
            borderColor: searchFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(30, 41, 59, 0.35)',
            color: '#fff',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 14,
          }}
          value={search}
          onChangeText={handleSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search by name, email, PUBG ID…"
          placeholderTextColor="#475569"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A017" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-surface-300 text-sm uppercase">No users found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = ROLE_BADGE[item.role] || ROLE_BADGE.buyer;
            const isProcessing = actionUid === item.uid;

            return (
              <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-3">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-3">
                    <View style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212, 160, 23, 0.1)' }} className="w-10 h-10 rounded-full items-center justify-center">
                      <Text className="text-[#D4A017] font-bold text-sm">
                        {item.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-white font-bold text-sm">{item.displayName}</Text>
                      <Text className="text-surface-300 text-xxs mt-0.5">{item.email}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: badge.bg, borderRadius: 2 }} className="px-2 py-0.5">
                    <Text style={{ letterSpacing: 0.5 }} className={`text-[10px] font-bold uppercase ${badge.text}`}>
                      {item.role}
                    </Text>
                  </View>
                </View>

                {/* Metadata Row */}
                <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 mb-4 border-t border-b border-white/5 py-2.5">
                  <Text className="text-surface-400 text-xxs uppercase">
                    PUBG: <Text className="text-white font-semibold">{item.pubgId ?? '—'}</Text>
                  </Text>
                  <Text className="text-surface-400 text-xxs uppercase">
                    Rep: <Text className="text-white font-semibold">{item.reputation}</Text>
                  </Text>
                  {item.isBanned && (
                    <View className="bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5">
                      <Text className="text-red-400 text-[9px] font-bold uppercase">Banned</Text>
                    </View>
                  )}
                  {item.isVerified && (
                    <View className="bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5">
                      <Text className="text-green-400 text-[9px] font-bold uppercase">Verified</Text>
                    </View>
                  )}
                </View>

                {/* Admin Actions Row */}
                {item.role !== 'admin' && (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        borderWidth: 1.5,
                        borderColor: item.isBanned ? '#22c55e' : '#D4A017',
                        backgroundColor: item.isBanned ? 'rgba(34,197,94,0.08)' : 'rgba(212,160,23,0.08)',
                        borderRadius: 2,
                        paddingVertical: 10,
                        alignItems: 'center',
                      }}
                      onPress={() => handleToggleBlock(item)}
                      disabled={isProcessing}
                    >
                      <Text
                        style={{
                          color: item.isBanned ? '#22c55e' : '#D4A017',
                          fontWeight: 'bold',
                          fontSize: 10,
                          letterSpacing: 0.5,
                        }}
                        className="uppercase"
                      >
                        {isProcessing ? 'Working…' : item.isBanned ? '✓ Unblock User' : '🚫 Block User'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1,
                        borderWidth: 1.5,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239,68,68,0.08)',
                        borderRadius: 2,
                        paddingVertical: 10,
                        alignItems: 'center',
                      }}
                      onPress={() => handleDeleteUser(item)}
                      disabled={isProcessing}
                    >
                      <Text
                        style={{
                          color: '#ef4444',
                          fontWeight: 'bold',
                          fontSize: 10,
                          letterSpacing: 0.5,
                        }}
                        className="uppercase"
                      >
                        {isProcessing ? 'Deleting…' : '✕ Delete User'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
