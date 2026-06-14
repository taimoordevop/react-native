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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

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

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await authService.resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
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

            {/* Back to Login Button */}
            <TouchableOpacity 
              className="absolute top-6 left-6 z-10 flex-row items-center" 
              onPress={() => router.back()}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: 'rgba(212, 160, 23, 0.3)',
                borderRadius: 2,
                backgroundColor: 'rgba(212, 160, 23, 0.05)',
              }}
            >
              <Text style={{ letterSpacing: 1.5 }} className="text-[#D4A017] text-xs font-bold uppercase">
                ← BACK TO BASE
              </Text>
            </TouchableOpacity>

            {/* Header / Protocol Name */}
            <View className="items-center mb-10 mt-12">
              <Text style={{ fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-condensed', letterSpacing: 4 }} className="text-white text-2xl font-extrabold text-center uppercase">
                RECOVERY PROTOCOL
              </Text>
              <Text style={{ letterSpacing: 2 }} className="text-[#D4A017] text-xs font-semibold uppercase mt-1">
                SECURE CREDENTIAL RESET
              </Text>
            </View>

            {/* Facebook Social Info Banner */}
            <View 
              style={{
                borderWidth: 1.5,
                borderColor: 'rgba(212, 160, 23, 0.3)',
                borderRadius: 4,
                backgroundColor: 'rgba(212, 160, 23, 0.06)',
                padding: 16,
                marginBottom: 24,
              }}
            >
              <View className="flex-row items-center mb-1.5">
                <View className="w-1.5 h-3 bg-[#D4A017] mr-2" />
                <Text style={{ letterSpacing: 2 }} className="text-[#D4A017] text-xs font-bold uppercase">
                  SOCIAL ID WARNING
                </Text>
              </View>
              <Text className="text-surface-300 text-xs leading-relaxed">
                If you registered using your Facebook account, password recovery is not required. Simply authenticate using the Facebook Login portal on the main login terminal.
              </Text>
            </View>

            {sent ? (
              <View 
                style={{
                  borderWidth: 1.5,
                  borderColor: '#22c55e',
                  borderRadius: 4,
                  backgroundColor: 'rgba(34, 197, 94, 0.08)',
                  padding: 20,
                  alignItems: 'center',
                }}
              >
                <Text style={{ letterSpacing: 1.5 }} className="text-[#22c55e] text-sm font-bold uppercase mb-2">
                  TRANSMISSION SUCCESSFUL
                </Text>
                <Text className="text-surface-200 text-xs text-center leading-relaxed">
                  Reset link sent to your terminal. Check your inbox to configure new password credentials.
                </Text>
              </View>
            ) : (
              <>
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
                    Security Intel
                  </Text>
                </View>

                {/* Email Field */}
                <View className="mb-8">
                  <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xs uppercase font-semibold mb-2">
                    RECOVERY EMAIL ADDRESS
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
                  />
                </View>

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
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 2 }}>
                    {loading ? 'TRANSMITTING RECOVERY LINK...' : 'INITIATE RESET'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
