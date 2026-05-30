import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTION } from '@/constants';
import type { UserProfile, UserRole } from '@/shared/types';

const ROLE_BADGE: Record<UserRole, { bg: string; text: string }> = {
  buyer:    { bg: 'bg-blue-500/20',   text: 'text-blue-400' },
  supplier: { bg: 'bg-green-500/20',  text: 'text-green-400' },
  seller:   { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  admin:    { bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, COLLECTION.USERS), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserProfile);
        setUsers(data);
        setFiltered(data);
      } catch (e) {
        console.error('[Admin] Failed to fetch users:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    const lower = text.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower) ||
          (u.pubgId ?? '').toLowerCase().includes(lower),
      ),
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-purple-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Manage Users</Text>
        <Text className="text-surface-300 text-sm ml-auto">{users.length} total</Text>
      </View>

      {/* Search */}
      <View className="px-4 py-3">
        <TextInput
          className="bg-surface-100 text-white rounded-xl px-4 py-3 text-sm"
          value={search}
          onChangeText={handleSearch}
          placeholder="Search by name, email, PUBG ID…"
          placeholderTextColor="#475569"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8b5cf6" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-surface-300 text-base">No users found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = ROLE_BADGE[item.role];
            return (
              <View className="bg-surface-100 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-surface-200 items-center justify-center">
                      <Text className="text-white font-bold">
                        {item.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-white font-semibold">{item.displayName}</Text>
                      <Text className="text-surface-300 text-xs">{item.email}</Text>
                    </View>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${badge.bg}`}>
                    <Text className={`text-xs font-semibold ${badge.text}`}>
                      {item.role}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-4">
                  <Text className="text-surface-300 text-xs">
                    PUBG: <Text className="text-white">{item.pubgId ?? '—'}</Text>
                  </Text>
                  <Text className="text-surface-300 text-xs">
                    Rep: <Text className="text-white">{item.reputation}</Text>
                  </Text>
                  {item.isBanned && (
                    <View className="px-2 py-0.5 rounded-full bg-red-500/20">
                      <Text className="text-red-400 text-xs">Banned</Text>
                    </View>
                  )}
                  {item.isVerified && (
                    <View className="px-2 py-0.5 rounded-full bg-green-500/20">
                      <Text className="text-green-400 text-xs">Verified</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
