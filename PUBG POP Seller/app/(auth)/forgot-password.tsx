import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { authService } from '@/features/auth/services/authService';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await authService.resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6 py-12">
        <TouchableOpacity className="mb-8" onPress={() => router.back()}>
          <Text className="text-primary-400 text-sm">← Back</Text>
        </TouchableOpacity>

        <Text className="text-4xl font-bold text-white mb-2">Reset password</Text>
        <Text className="text-surface-300 text-base mb-6">
          Enter your email to receive a reset link
        </Text>

        {/* Facebook Social Info Banner */}
        <View className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 mb-8">
          <Text className="text-[#D4A017] text-xs font-semibold uppercase tracking-wider mb-1">
            Facebook Log In
          </Text>
          <Text className="text-surface-300 text-xs leading-relaxed">
            If you signed up with Facebook, please use the Facebook button on the login screen to log in.
          </Text>
        </View>

        {sent ? (
          <View className="bg-green-500/20 border border-green-500 rounded-xl p-4 mb-6">
            <Text className="text-green-400 text-sm">
              Reset email sent! Check your inbox.
            </Text>
          </View>
        ) : (
          <>
            {error && (
              <View className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            )}
            <View className="mb-6">
              <Text className="text-surface-300 text-sm mb-2">Email</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              className="bg-primary-500 rounded-xl py-4 items-center"
              onPress={handleReset}
              disabled={loading}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
