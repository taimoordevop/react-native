import { Redirect, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuthStore } from '@/features/auth/store/authStore';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navState = useRootNavigationState();
  const [debugDone, setDebugDone] = useState(false);

  // Debug overlay: shows for 3 seconds to confirm JS is running
  useEffect(() => {
    console.log('[NAV] Index mounted ✅ — JS is executing');
    const t = setTimeout(() => {
      console.log('[NAV] Debug overlay dismissed');
      setDebugDone(true);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    console.log('[NAV] State — isLoading:', isLoading, '| isAuthenticated:', isAuthenticated, '| navReady:', !!navState?.key, '| debugDone:', debugDone);
  });

  // Always show debug banner for 3s so we can confirm the screen renders
  if (!debugDone) {
    return (
      <View style={styles.debug}>
        <Text style={styles.debugTitle}>✅ APP LOADED</Text>
        <Text style={styles.debugSub}>JS is running in Expo Go</Text>
        <View style={styles.debugInfo}>
          <Text style={styles.debugInfoText}>isLoading: {String(isLoading)}</Text>
          <Text style={styles.debugInfoText}>isAuthenticated: {String(isAuthenticated)}</Text>
          <Text style={styles.debugInfoText}>navReady: {String(!!navState?.key)}</Text>
        </View>
        <ActivityIndicator color="#fff" style={styles.spinner} />
        <Text style={styles.debugHint}>Redirecting in 3 seconds…</Text>
      </View>
    );
  }

  if (!navState?.key || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.hint}>Loading session…</Text>
      </View>
    );
  }

  console.log('[NAV] Redirecting — isAuthenticated:', isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#475569', fontSize: 13, marginTop: 8 },
  // Debug overlay styles
  debug: { flex: 1, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', padding: 32 },
  debugTitle: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  debugSub: { color: '#dcfce7', fontSize: 16, marginBottom: 24 },
  debugInfo: { backgroundColor: '#15803d', borderRadius: 12, padding: 16, width: '100%', marginBottom: 24 },
  debugInfoText: { color: '#bbf7d0', fontSize: 14, fontFamily: 'monospace', marginBottom: 4 },
  spinner: { marginBottom: 16 },
  debugHint: { color: '#dcfce7', fontSize: 13 },
});
