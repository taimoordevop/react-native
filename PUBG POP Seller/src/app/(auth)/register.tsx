import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirm) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const profile = await authService.signUp(email, password, displayName);
      setUser(profile);
      // New users always go through onboarding first
      router.replace('/(auth)/onboarding/role-select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
          <Text className="text-4xl font-bold text-white mb-2">Create account</Text>
          <Text className="text-surface-300 text-base mb-10">
            Join POP Seller and start trading
          </Text>

          {error && (
            <View className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          {[
            { label: 'Display Name', value: displayName, onChange: setDisplayName, placeholder: 'Your seller name', type: 'default' as const },
            { label: 'Email', value: email, onChange: setEmail, placeholder: 'your@email.com', type: 'email-address' as const },
          ].map(({ label, value, onChange, placeholder, type }) => (
            <View key={label} className="mb-4">
              <Text className="text-surface-300 text-sm mb-2">{label}</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#475569"
                keyboardType={type}
                autoCapitalize="none"
              />
            </View>
          ))}

          <View className="mb-4">
            <Text className="text-surface-300 text-sm mb-2">Password</Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              placeholderTextColor="#475569"
              secureTextEntry
            />
          </View>

          <View className="mb-6">
            <Text className="text-surface-300 text-sm mb-2">Confirm Password</Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              placeholderTextColor="#475569"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-4 items-center mb-4"
            onPress={handleRegister}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-surface-300 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-primary-400 text-sm font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
