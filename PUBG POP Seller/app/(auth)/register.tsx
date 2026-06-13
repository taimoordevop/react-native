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

function PasswordStrengthBar({ strength }: { strength: number }) {
  const getSegmentColor = (index: number) => {
    if (strength === 0) return 'rgba(255,255,255,0.08)';
    if (strength === 1) return index === 0 ? '#ef4444' : 'rgba(255,255,255,0.08)'; // weak: red first segment
    if (strength === 2) return index <= 1 ? '#f97316' : 'rgba(255,255,255,0.08)'; // medium: orange first two segments
    return '#D4A017'; // strong: gold all segments
  };

  return (
    <View className="flex-row gap-2 mt-2.5">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          className="flex-1 h-1 rounded-full"
          style={{ backgroundColor: getSegmentColor(i) }}
        />
      ))}
    </View>
  );
}

export default function RegisterScreen() {
  const [pubgNickname, setPubgNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Focus States
  const [nicknameFocused, setNicknameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animated Scan Line
  const scanAnim = useRef(new Animated.Value(0)).current;

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

  // Calculate Password Strength
  const getPasswordStrength = () => {
    if (!password) return 0;
    if (password.length < 6) return 1; // Weak
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    if (password.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      return 3; // Strong
    }
    return 2; // Medium
  };

  // Live Display Name / Nickname uniqueness check
  useEffect(() => {
    const name = pubgNickname.trim();
    if (!name) {
      setNicknameError(null);
      return;
    }
    if (name.length < 3) {
      setNicknameError('Name must be at least 3 characters');
      return;
    }

    let active = true;
    const handle = setTimeout(async () => {
      try {
        const available = await authService.isDisplayNameAvailable(name);
        if (!active) return;
        setNicknameError(available ? null : 'This name is already taken');
      } catch (e) {
        console.error('[AUTH] nickname check failed:', e);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [pubgNickname]);

  // Live email format + uniqueness check
  useEffect(() => {
    const value = email.trim().toLowerCase();
    if (!value) {
      setEmailError(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Enter a valid email address');
      return;
    }

    let active = true;
    const handle = setTimeout(async () => {
      try {
        const available = await authService.isEmailAvailable(value);
        if (!active) return;
        setEmailError(available ? null : 'This email is already in use');
      } catch (e) {
        console.error('[AUTH] email check failed:', e);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [email]);

  const handleRegister = async () => {
    if (!pubgNickname || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!agreed) {
      setError('You must agree to the Terms of Service & Privacy Policy');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (nicknameError) {
      setError(nicknameError);
      return;
    }
    if (emailError) {
      setError(emailError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const normalizedEmail = email.trim().toLowerCase();
      const name = pubgNickname.trim();

      const [nameAvailable, emailAvailable] = await Promise.all([
        authService.isDisplayNameAvailable(name),
        authService.isEmailAvailable(normalizedEmail),
      ]);

      if (!nameAvailable) {
        setError('This name is already taken');
        return;
      }
      if (!emailAvailable) {
        setError('This email is already in use');
        return;
      }

      await authService.signUp(normalizedEmail, password, name, name);
      router.replace('/(auth)/onboarding/role-select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
                className="flex-1 py-4 items-center bg-transparent"
                activeOpacity={0.8}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={{ letterSpacing: 1.5 }} className="text-surface-400 font-bold text-sm">LOGIN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-4 items-center bg-[#D4A017]/10"
                activeOpacity={0.8}
              >
                <Text style={{ letterSpacing: 1.5 }} className="text-[#D4A017] font-bold text-sm">SIGN UP</Text>
              </TouchableOpacity>
            </View>

            {/* ERROR DISPLAY */}
            {(error || nicknameError || emailError) && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <Text className="text-red-400 text-xs font-medium">
                  {nicknameError || emailError || error}
                </Text>
              </View>
            )}

            {/* Section Tag */}
            <View className="flex-row items-center mb-5">
              <View className="w-1.5 h-3 bg-[#D4A017] mr-2" />
              <Text style={{ letterSpacing: 2 }} className="text-[#D4A017] text-xs font-bold uppercase">
                New Recruit
              </Text>
            </View>

            {/* PUBG Nickname */}
            <View className="mb-5">
              <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs uppercase font-semibold mb-2">
                PUBG Nickname
              </Text>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: nicknameFocused ? '#D4A017' : 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(30,41,59,0.4)',
                  color: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                }}
                value={pubgNickname}
                onChangeText={setPubgNickname}
                onFocus={() => setNicknameFocused(true)}
                onBlur={() => setNicknameFocused(false)}
                placeholder="PlayerName#1234"
                placeholderTextColor="#475569"
                autoCapitalize="none"
              />
            </View>

            {/* Email Field */}
            <View className="mb-5">
              <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs uppercase font-semibold mb-2">
                Email
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
            <View className="mb-5">
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
                placeholder="Min. 8 characters"
                placeholderTextColor="#475569"
                secureTextEntry
                autoComplete="new-password"
              />
              <PasswordStrengthBar strength={getPasswordStrength()} />
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              className="flex-row items-center mb-8"
              activeOpacity={0.8}
              onPress={() => setAgreed(!agreed)}
            >
              <View
                style={{
                  borderColor: agreed ? '#D4A017' : 'rgba(255,255,255,0.2)',
                  backgroundColor: agreed ? 'rgba(212,160,23,0.1)' : 'transparent',
                  borderWidth: 1.5,
                  borderRadius: 4,
                  width: 18,
                  height: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                {agreed && <Text style={{ color: '#D4A017', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
              </View>
              <Text className="text-surface-400 text-xs flex-1">
                I agree to the <Text className="text-[#D4A017]">Terms of Service</Text> & <Text className="text-[#D4A017]">Privacy Policy</Text>
              </Text>
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
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 2 }}>
                {loading ? 'DEPLOYING TO BATTLE...' : 'DEPLOY TO MARKET'}
              </Text>
            </TouchableOpacity>

            {/* Bottom Redirection */}
            <View className="flex-row justify-center mt-8">
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={{ letterSpacing: 1 }} className="text-surface-400 text-xs font-bold text-center">
                  Already a soldier? Switch to <Text className="text-[#D4A017]">Login ↑</Text>
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
