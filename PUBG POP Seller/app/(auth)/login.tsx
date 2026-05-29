import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setLoading: setAuthLoading, rememberMe, setRememberMe, isAuthenticated } = useAuthStore();

  // If the user is already authenticated (e.g. Firebase session + profile loaded),
  // never keep them on the login screen — immediately send them through the
  // normal index.tsx redirect flow.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await authService.signIn(email, password);
      // Mark auth as loading BEFORE navigating so index.tsx shows the spinner
      // instead of briefly redirecting back to login (isAuthenticated is still
      // false until onAuthStateChanged fires and resolves the profile).
      if (!isAuthenticated) {
        setAuthLoading(true);
      }
      router.replace('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      console.error('[AUTH] Login error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          <Text className="text-4xl font-bold text-white mb-2">Welcome back</Text>
          <Text className="text-surface-300 text-base mb-10">Sign in to your POP Seller account</Text>

          {error && (
            <View className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-surface-300 text-sm mb-2">Email</Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#475569"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View className="mb-4">
            <Text className="text-surface-300 text-sm mb-2">Password</Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#475569"
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              className="flex-row items-center"
              activeOpacity={0.8}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View
                className={`w-5 h-5 rounded-md mr-2 border items-center justify-center ${
                  rememberMe ? 'bg-primary-500 border-primary-400' : 'border-surface-400'
                }`}
              >
                {rememberMe && <Text className="text-white text-xs">✓</Text>}
              </View>
              <Text className="text-surface-300 text-sm">Remember me</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-4 items-center mb-4"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center mb-4"
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text className="text-primary-400 text-sm">Forgot password?</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-surface-300 text-sm">Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-primary-400 text-sm font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

