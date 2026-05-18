import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="mb-8">
          <Text className="text-surface-300 text-sm">Welcome back,</Text>
          <Text className="text-white text-2xl font-bold">
            {user?.displayName ?? 'Seller'}
          </Text>
        </View>

        <View className="flex-row gap-4 mb-6">
          {[
            { label: 'Active Listings', value: '0', color: 'bg-primary-500/20 border-primary-500/30' },
            { label: 'Total Orders', value: '0', color: 'bg-brand/20 border-brand/30' },
          ].map(({ label, value, color }) => (
            <View
              key={label}
              className={`flex-1 rounded-2xl border p-4 ${color}`}
            >
              <Text className="text-white text-3xl font-bold">{value}</Text>
              <Text className="text-surface-300 text-sm mt-1">{label}</Text>
            </View>
          ))}
        </View>

        <View className="bg-surface-100 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold text-base mb-3">Quick Actions</Text>
          {[
            { label: 'Create New Listing', bg: 'bg-primary-500' },
            { label: 'View My Orders', bg: 'bg-surface-200' },
            { label: 'Submit Proof', bg: 'bg-surface-200' },
          ].map(({ label, bg }) => (
            <TouchableOpacity
              key={label}
              className={`${bg} rounded-xl py-3 px-4 mb-2 items-center`}
            >
              <Text className="text-white font-medium">{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-surface-100 rounded-2xl p-4">
          <Text className="text-white font-semibold text-base mb-3">Recent Activity</Text>
          <Text className="text-surface-300 text-sm text-center py-6">
            No recent activity yet
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
