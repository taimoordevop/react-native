import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

export default function SellerLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Redirect href={'/(auth)/login' as never} />;
  if (user?.role && user.role !== 'seller') return <Redirect href={'/' as never} />;

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
      <Stack.Screen name="my-requests" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
