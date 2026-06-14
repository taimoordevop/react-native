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
      <SafeAreaView className="flex-1 bg-[#090d16] justify-center items-center p-6 relative">
        {/* Background elements */}
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

        <View 
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(212, 160, 23, 0.15)',
          }}
          pointerEvents="none"
        >
          <View style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderLeftWidth: 2, borderTopWidth: 2, borderColor: '#D4A017' }} />
          <View style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRightWidth: 2, borderTopWidth: 2, borderColor: '#D4A017' }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017' }} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017' }} />
        </View>

        <View 
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            borderWidth: 1.5,
            borderColor: '#D4A017',
            borderRadius: 4,
            padding: 24,
            alignItems: 'center',
            width: '100%',
            maxWidth: 300,
          }}
        >
          <Text className="text-4xl mb-4 text-[#D4A017]">⚠️</Text>
          <Text style={{ letterSpacing: 2 }} className="text-white text-lg font-bold mb-2 text-center uppercase">
            PROTOCOL LOCK
          </Text>
          <Text className="text-surface-300 text-xs text-center mb-6 leading-5">
            This sector is locked while your Seller approval is under review. Complete clearance will be granted post verification.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(seller)/dashboard')}
            style={{
              borderWidth: 1.5,
              borderColor: '#D4A017',
              borderRadius: 2,
              backgroundColor: 'rgba(212, 160, 23, 0.15)',
              paddingVertical: 12,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1.5 }}>
              RETURN TO DASHBOARD
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#090d16' },
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
