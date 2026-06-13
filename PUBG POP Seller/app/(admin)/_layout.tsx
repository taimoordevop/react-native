import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

export default function AdminLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Redirect href={'/(auth)/login' as never} />;
  if (user?.role && user.role !== 'admin') return <Redirect href={'/' as never} />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f172a' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="users" />
      <Stack.Screen name="all-orders" />
      <Stack.Screen name="disputes" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="seller-approvals" />
    </Stack>
  );
}
