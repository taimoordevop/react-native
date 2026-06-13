import { Redirect, Stack, usePathname, router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';

export default function SellerLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const pathname = usePathname();

  if (!isAuthenticated) return <Redirect href={'/(auth)/login' as never} />;
  if (user?.role && user.role !== 'seller') return <Redirect href={'/' as never} />;

  // Centralized Seller Approval Check:
  // If approval status is pending, limit access only to dashboard and profile.
  const isAllowed = pathname.endsWith('/dashboard') || pathname.endsWith('/profile');
  if (user?.sellerApprovalStatus === 'pending' && !isAllowed) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center p-6">
        <View className="bg-surface-100 border border-yellow-500/20 rounded-2xl p-6 items-center w-full max-w-xs">
          <Text className="text-5xl mb-4">🔒</Text>
          <Text className="text-white text-xl font-bold mb-2 text-center">Feature Locked</Text>
          <Text className="text-surface-300 text-sm text-center mb-6 leading-5">
            This feature is locked while your Seller approval is under review. Full access will be granted after verification.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(seller)/dashboard')}
            className="bg-yellow-500 rounded-xl py-3.5 px-6 w-full items-center"
          >
            <Text className="text-black font-semibold text-sm">Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f172a' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="post-request" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="buyer-requests" />
      <Stack.Screen name="supplier-requests" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="log-deal" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="log-manual-deal" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
