import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function AuthLayout() {
  useEffect(() => {
    console.log('[NAV] AuthLayout mounted');
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="seller-approval" />
    </Stack>
  );
}
