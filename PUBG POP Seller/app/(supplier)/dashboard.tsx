import { router } from 'expo-router';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useSupplierBookings, useOpenSupplierRequests } from '@/features/requests/hooks/useRequests';

export default function SupplierDashboard() {
  const { user } = useAuthStore();
  const { bookings } = useSupplierBookings(user?.uid);
  const { requests: openRequests } = useOpenSupplierRequests();

  const pendingBookings   = bookings.filter((b) => b.status === 'pending');
  const acceptedBookings  = bookings.filter((b) => b.status === 'accepted');
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  const totalEarnings = completedBookings.reduce(
    (sum, b) => sum + b.bookedAmount,   // tracking POP sent
    0,
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-surface-300 text-sm">Welcome back,</Text>
          <Text className="text-white text-2xl font-bold">
            {user?.displayName ?? 'Supplier'}
          </Text>
          <View className="self-start mt-1 px-3 py-1 rounded-full bg-green-500/20">
            <Text className="text-green-400 text-xs font-semibold">Supplier</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-yellow-500/20">
            <Text className="text-yellow-400 text-3xl font-bold">{pendingBookings.length}</Text>
            <Text className="text-surface-300 text-xs mt-1">Pending</Text>
          </View>
          <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-blue-500/20">
            <Text className="text-blue-400 text-3xl font-bold">{acceptedBookings.length}</Text>
            <Text className="text-surface-300 text-xs mt-1">To Send</Text>
          </View>
          <View className="flex-1 bg-surface-100 rounded-2xl p-4 border border-green-500/20">
            <Text className="text-green-400 text-2xl font-bold">
              {totalEarnings >= 1000 ? `${(totalEarnings / 1000).toFixed(0)}k` : String(totalEarnings)}
            </Text>
            <Text className="text-surface-300 text-xs mt-1">POP Sent</Text>
          </View>
        </View>

        {/* Available requests teaser */}
        {openRequests.length > 0 && (
          <TouchableOpacity
            className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-4 flex-row items-center"
            onPress={() => router.push('/(supplier)/requests' as never)}
          >
            <View className="flex-1">
              <Text className="text-green-400 font-bold">
                {openRequests.length} Open Request{openRequests.length !== 1 ? 's' : ''} Available
              </Text>
              <Text className="text-green-400/70 text-xs mt-0.5">
                Tap to browse and book POP amounts you can supply
              </Text>
            </View>
            <Text className="text-green-400 text-xl">›</Text>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Quick Actions</Text>

          <TouchableOpacity
            className="bg-green-600 rounded-xl py-4 px-4 mb-3 flex-row items-center"
            onPress={() => router.push('/(supplier)/requests' as never)}
          >
            <Text className="text-white font-bold flex-1">Browse Seller Requests</Text>
            <Text className="text-white/60">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface-200 rounded-xl py-4 px-4 flex-row items-center"
            onPress={() => router.push('/(supplier)/my-bookings' as never)}
          >
            <Text className="text-white font-medium flex-1">My Bookings</Text>
            {acceptedBookings.length > 0 && (
              <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center mr-2">
                <Text className="text-white text-xs font-bold">{acceptedBookings.length}</Text>
              </View>
            )}
            <Text className="text-surface-300">›</Text>
          </TouchableOpacity>
        </View>

        {/* Recent bookings */}
        <View className="bg-surface-100 rounded-2xl p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-semibold">Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/(supplier)/my-bookings' as never)}>
              <Text className="text-primary-400 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {bookings.slice(0, 3).length === 0 ? (
            <Text className="text-surface-300 text-sm text-center py-4">
              No bookings yet. Browse open requests to get started.
            </Text>
          ) : (
            bookings.slice(0, 3).map((b) => (
              <View
                key={b.id}
                className="flex-row justify-between items-center py-3 border-b border-surface-200"
              >
                <View>
                  <Text className="text-white text-sm font-medium">
                    {b.bookedAmount.toLocaleString()} POP
                  </Text>
                  <Text className="text-surface-300 text-xs">
                    Req: {b.requestId.slice(0, 8)}…
                  </Text>
                </View>
                <View className={`px-2 py-0.5 rounded-full ${
                  b.status === 'completed' ? 'bg-green-500/20' :
                  b.status === 'accepted'  ? 'bg-blue-500/20'  : 'bg-yellow-500/20'
                }`}>
                  <Text className={`text-xs font-semibold capitalize ${
                    b.status === 'completed' ? 'text-green-400' :
                    b.status === 'accepted'  ? 'text-blue-400'  : 'text-yellow-400'
                  }`}>
                    {b.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
