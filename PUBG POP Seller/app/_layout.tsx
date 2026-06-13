import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  useFonts,
  Orbitron_900Black,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import {
  Rajdhani_400Regular,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';

import '../src/global.css';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { queryClient } from '@/lib/queryClient';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { SplashScreenComponent } from '@/shared/components/SplashScreen';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Orbitron_900Black,
    Orbitron_700Bold,
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    console.log('[NAV] RootLayout mounted');
    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded || !splashFinished) {
    return <SplashScreenComponent />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#0f172a' },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                {/* Role-specific navigation groups */}
                <Stack.Screen name="(buyer)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(supplier)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(seller)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(admin)" options={{ animation: 'fade' }} />
                {/* Legacy (tabs) kept for backwards compat / create-listing flow */}
                <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                {/* Shared modal/stack screens accessible from any role */}
                <Stack.Screen name="listing/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="orders/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="orders/proof-upload" options={{ animation: 'slide_from_bottom' }} />
              </Stack>
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
