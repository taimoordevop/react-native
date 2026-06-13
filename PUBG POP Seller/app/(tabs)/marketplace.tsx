import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import {
  useActiveListings,
  useSupplierListings,
  useSetListingStatus,
} from '@/features/marketplace/hooks/useListings';
import { ListingCard, LoadingScreen } from '@/shared/components';
import type { Listing } from '@/shared/types';

type TabKey = 'browse' | 'mine';

export default function MarketplaceScreen() {
  const { user } = useAuth();
  const isSupplier = user?.role === 'supplier' || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<TabKey>('browse');
  const [search, setSearch] = useState('');

  // Browse tab — all active listings
  const {
    data: activeListings,
    isLoading: loadingActive,
    refetch: refetchActive,
    isRefetching: refreshingActive,
  } = useActiveListings();

  // My Listings tab — supplier's own listings
  const {
    data: myListings,
    isLoading: loadingMine,
    refetch: refetchMine,
    isRefetching: refreshingMine,
  } = useSupplierListings(isSupplier ? user?.uid : undefined);

  const setStatus = useSetListingStatus();

  // Filter active listings by supplier name search
  const filteredListings = useMemo<Listing[]>(() => {
    const source = activeListings ?? [];
    if (!search.trim()) return source;
    const q = search.trim().toLowerCase();
    return source.filter(
      (l) =>
        l.supplierName.toLowerCase().includes(q) ||
        (l.supplierPubgNickname?.toLowerCase().includes(q) ?? false),
    );
  }, [activeListings, search]);

  const handleMarkSoldOut = (id: string) => {
    setStatus.mutate({ id, status: 'sold_out' });
  };

  const isLoading = activeTab === 'browse' ? loadingActive : loadingMine;
  const isRefreshing = activeTab === 'browse' ? refreshingActive : refreshingMine;
  const onRefresh = activeTab === 'browse' ? refetchActive : refetchMine;
  const listData: Listing[] =
    activeTab === 'browse' ? filteredListings : (myListings ?? []);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* ── Header ── */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-bold">Marketplace</Text>
          {isSupplier && (
            <TouchableOpacity
              className="bg-primary-500 rounded-xl px-4 py-2"
              onPress={() => router.push('/(tabs)/create-listing')}
            >
              <Text className="text-white text-sm font-semibold">+ List POP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Tabs: Browse / My Listings ── */}
        <View className="flex-row bg-surface-100 rounded-xl p-1 mb-4">
          {([
            { key: 'browse' as TabKey, label: 'Browse' },
            ...(isSupplier ? [{ key: 'mine' as TabKey, label: 'My Listings' }] : []),
          ]).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === key ? 'bg-primary-500' : ''
              }`}
              onPress={() => setActiveTab(key)}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === key ? 'text-white' : 'text-surface-300'
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Search (browse tab only) ── */}
        {activeTab === 'browse' && (
          <TextInput
            className="bg-surface-100 text-white rounded-xl px-4 py-3 text-sm mb-3"
            placeholder="Search by supplier or PUBG nickname..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        )}
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <LoadingScreen variant="market" />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              isOwner={item.supplierId === user?.uid}
              onMarkSoldOut={handleMarkSoldOut}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} // eslint-disable-line react-native/no-inline-styles
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-surface-300 text-base mb-2">
                {activeTab === 'browse' ? 'No active listings' : 'No listings yet'}
              </Text>
              {activeTab === 'mine' && isSupplier && (
                <TouchableOpacity
                  className="bg-primary-500 rounded-xl px-6 py-3 mt-2"
                  onPress={() => router.push('/(tabs)/create-listing')}
                >
                  <Text className="text-white font-semibold">Create First Listing</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
