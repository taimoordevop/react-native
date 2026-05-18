import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('[AUTH] Login attempt for:', email);
      const credential = await authService.signIn(email, password);
      console.log('[AUTH] Firebase sign-in success — uid:', credential.user.uid);
      const profile = await authService.getUserProfile(credential.user.uid);
      console.log('[AUTH] Profile fetched — onboarding:', profile?.onboardingCompleted, '| role:', profile?.role);
      // profile may be null if Firestore doc is missing — AuthProvider fallback handles it
      setUser(profile);
      if (!profile?.onboardingCompleted) {
        console.log('[AUTH] Redirecting to onboarding');
        router.replace('/(auth)/onboarding/role-select');
      } else {
        console.log('[AUTH] Redirecting to tabs');
        router.replace('/(tabs)');
      }
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
        {/* DEBUG BANNER — remove after confirming screens work */}
        <View style={debugStyles.banner}>
          <Text style={debugStyles.bannerText}>✅ LOGIN SCREEN LOADED</Text>
        </View>
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

          <View className="mb-6">
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

const debugStyles = StyleSheet.create({
  banner: { backgroundColor: '#7c3aed', padding: 12, alignItems: 'center' },
  bannerText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
