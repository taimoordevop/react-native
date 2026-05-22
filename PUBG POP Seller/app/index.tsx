import { Redirect, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuthStore } from '@/features/auth/store/authStore';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const navState = useRootNavigationState();

  if (!navState?.key || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/login' as never} />;
  }

  const role = user?.role ?? 'buyer';

  if (role === 'admin') return <Redirect href={'/(admin)/dashboard' as never} />;
  if (role === 'seller') return <Redirect href={'/(seller)/dashboard' as never} />;
  if (role === 'supplier') return <Redirect href={'/(supplier)/dashboard' as never} />;
  return <Redirect href={'/(buyer)/dashboard' as never} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
});
