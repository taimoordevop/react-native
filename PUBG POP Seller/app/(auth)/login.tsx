import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/features/auth/services/authService';
import { socialAuthService } from '@/features/auth/services/socialAuthService';
import { useAuthStore } from '@/features/auth/store/authStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function TacticalGrid() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 }} pointerEvents="none">
      {/* Vertical Grid Lines */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[...Array(12)].map((_, i) => (
          <View key={i} style={{ width: 1, height: '100%', backgroundColor: '#D4A017' }} />
        ))}
      </View>
      {/* Horizontal Grid Lines */}
      <View style={{ justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[...Array(20)].map((_, i) => (
          <View key={i} style={{ height: 1, width: '100%', backgroundColor: '#D4A017' }} />
        ))}
      </View>
    </View>
  );
}

function CornerReticles() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      {/* Top Left */}
      <View style={{ position: 'absolute', top: 16, left: 16, width: 16, height: 16, borderLeftWidth: 2, borderTopWidth: 2, borderColor: '#D4A017', opacity: 0.7 }} />
      {/* Top Right */}
      <View style={{ position: 'absolute', top: 16, right: 16, width: 16, height: 16, borderRightWidth: 2, borderTopWidth: 2, borderColor: '#D4A017', opacity: 0.7 }} />
      {/* Bottom Left */}
      <View style={{ position: 'absolute', bottom: 16, left: 16, width: 16, height: 16, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017', opacity: 0.7 }} />
      {/* Bottom Right */}
      <View style={{ position: 'absolute', bottom: 16, right: 16, width: 16, height: 16, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017', opacity: 0.7 }} />
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const { setLoading: setAuthLoading, isAuthenticated } = useAuthStore();

  const handleGoogleLogin = async () => {
    if (loading || googleLoading || facebookLoading) return;
    try {
      setGoogleLoading(true);
      setError(null);
      await socialAuthService.signInWithGoogle();
      router.replace('/');
    } catch (err: any) {
      if (err.message && err.message.includes('cancelled')) {
        return; // ignore cancellation
      }
      let errorMsg = err instanceof Error ? err.message : 'Google authentication failed';
      if (err.code === 'auth/account-exists-with-different-credential') {
        errorMsg = 'An account already exists with this email address. Please log in using your password or correct provider.';
      }
      console.error('[AUTH] Google Sign-in error:', errorMsg);
      setError(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    if (loading || googleLoading || facebookLoading) return;
    try {
      setFacebookLoading(true);
      setError(null);
      await socialAuthService.signInWithFacebook();
      router.replace('/');
    } catch (err: any) {
      if (err.message && err.message.includes('cancelled')) {
        return; // ignore cancellation
      }
      let errorMsg = err instanceof Error ? err.message : 'Facebook authentication failed';
      if (err.code === 'auth/account-exists-with-different-credential') {
        errorMsg = 'An account already exists with this email address. Please log in using your password or correct provider.';
      }
      console.error('[AUTH] Facebook Sign-in error:', errorMsg);
      setError(errorMsg);
    } finally {
      setFacebookLoading(false);
    }
  };

  // Animated Scan Line
  const scanAnim = useRef(new Animated.Value(0)).current;

  // Input Focus States
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT],
  });

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
      await authService.signIn(email.trim().toLowerCase(), password);
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
      className="flex-1 bg-[#090d16]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView className="flex-1">
        {/* Animated Scan Line Overlay */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: '#D4A017',
            opacity: 0.25,
            shadowColor: '#D4A017',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 5,
            transform: [{ translateY }],
          }}
          pointerEvents="none"
        />

        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6 py-8 relative">
            {/* Background elements */}
            <TacticalGrid />
            <CornerReticles />

            {/* Header / Logo */}
            <View className="items-center mb-8">
              <Text style={{ fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-condensed', letterSpacing: 4 }} className="text-white text-3xl font-extrabold text-center">
                PUBG<Text className="text-[#D4A017]">-</Text>MART
              </Text>
              <Text style={{ letterSpacing: 2 }} className="text-surface-400 text-xs font-semibold uppercase mt-1">
                Marketplace
              </Text>
            </View>

            {/* TAB SELECTOR */}
            <View className="flex-row border border-surface-200/50 rounded-xl overflow-hidden mb-8 bg-surface-100/30">
              <TouchableOpacity
                className="flex-1 py-4 items-center bg-[#D4A017]/10"
                activeOpacity={0.8}
              >
                <Text style={{ letterSpacing: 1.5 }} className="text-[#D4A017] font-bold text-sm">LOGIN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-4 items-center bg-transparent"
                activeOpacity={0.8}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={{ letterSpacing: 1.5 }} className="text-surface-400 font-bold text-sm">SIGN UP</Text>
              </TouchableOpacity>
            </View>

            {/* ERROR DISPLAY */}
            {error && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <Text className="text-red-400 text-xs font-medium">{error}</Text>
              </View>
            )}

            {/* Section Tag */}
            <View className="flex-row items-center mb-5">
              <View className="w-1.5 h-3 bg-[#D4A017] mr-2" />
              <Text style={{ letterSpacing: 2 }} className="text-[#D4A017] text-xs font-bold uppercase">
                Credentials
              </Text>
            </View>

            {/* Email Field */}
            <View className="mb-5">
              <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs uppercase font-semibold mb-2">
                Email / PUBG ID
              </Text>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: emailFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(30,41,59,0.4)',
                  color: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                }}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="operator@mail.com"
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Password Field */}
            <View className="mb-4">
              <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs uppercase font-semibold mb-2">
                Password
              </Text>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: passwordFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(30,41,59,0.4)',
                  color: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                }}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="••••••••"
                placeholderTextColor="#475569"
                secureTextEntry
                autoComplete="password"
              />
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              className="align-self-end mb-8"
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text className="text-[#D4A017] text-xs font-semibold text-right">Forgot password?</Text>
            </TouchableOpacity>

            {/* Submit Button (Clipped Corner HUD Look) */}
            <TouchableOpacity
              style={{
                borderWidth: 1.5,
                borderColor: '#D4A017',
                borderRadius: 2,
                backgroundColor: 'rgba(212, 160, 23, 0.1)',
                paddingVertical: 16,
                alignItems: 'center',
                shadowColor: '#D4A017',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 2 }}>
                {loading ? 'DEPLOYING SQUAD...' : 'ENTER BATTLEGROUND'}
              </Text>
            </TouchableOpacity>

            {/* Separator */}
            <View className="flex-row items-center my-8">
              <View className="flex-grow h-px bg-surface-200/20" />
              <Text style={{ letterSpacing: 1 }} className="text-surface-400 text-xxs font-bold uppercase mx-3">
                Or continue with
              </Text>
              <View className="flex-grow h-px bg-surface-200/20" />
            </View>

            {/* Secondary Buttons */}
            <View className="flex-row gap-4 mb-6">
              <TouchableOpacity
                className="flex-1 py-3.5 border border-surface-200/30 rounded-lg bg-surface-100/10 items-center"
                activeOpacity={0.8}
                onPress={handleGoogleLogin}
                disabled={loading || googleLoading || facebookLoading}
              >
                <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-bold uppercase">
                  {googleLoading ? 'WAIT...' : 'Google'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 border border-surface-200/30 rounded-lg bg-surface-100/10 items-center"
                activeOpacity={0.8}
                onPress={handleFacebookLogin}
                disabled={loading || googleLoading || facebookLoading}
              >
                <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs font-bold uppercase">
                  {facebookLoading ? 'WAIT...' : 'Facebook'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Redirection */}
            <View className="flex-row justify-center mt-6">
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={{ letterSpacing: 1 }} className="text-surface-400 text-xs font-bold text-center">
                  New recruit? Switch to <Text className="text-[#D4A017]">Sign Up ↑</Text>
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
