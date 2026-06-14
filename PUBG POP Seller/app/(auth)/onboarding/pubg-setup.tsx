import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { profileService } from '@/features/profile/services/profileService';

function TacticalGrid() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 }} pointerEvents="none">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[...Array(12)].map((_, i) => (
          <View key={i} style={{ width: 1, height: '100%', backgroundColor: '#D4A017' }} />
        ))}
      </View>
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
      <View style={{ position: 'absolute', top: 16, left: 16, width: 16, height: 16, borderLeftWidth: 2, borderTopWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', top: 16, right: 16, width: 16, height: 16, borderRightWidth: 2, borderTopWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 16, left: 16, width: 16, height: 16, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 16, right: 16, width: 16, height: 16, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
    </View>
  );
}

export default function PubgSetupScreen() {
  const [pubgId, setPubgId] = useState('');
  const [pubgNickname, setPubgNickname] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setUser, setOnboardingCompleted } = useAuthStore();

  useEffect(() => {
    if (user) {
      if (user.displayName) {
        setUsername(user.displayName);
      }
      if (user.pubgNickname) {
        setPubgNickname(user.pubgNickname);
      } else if (user.displayName) {
        setPubgNickname(user.displayName);
      }
    }
  }, [user]);

  useEffect(() => {
    const name = username.trim();
    if (!name) {
      setUsernameError(null);
      return;
    }
    if (name.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (user && name === user.displayName) {
      setUsernameError(null);
      return;
    }

    setUsernameChecking(true);
    let active = true;
    const handle = setTimeout(async () => {
      try {
        const available = await authService.isDisplayNameAvailable(name);
        if (!active) return;
        setUsernameError(available ? null : 'This username is already taken');
      } catch (e) {
        console.error('[AUTH] Username availability check failed:', e);
      } finally {
        if (active) setUsernameChecking(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [username, user]);

  const validate = (): string | null => {
    if (!username.trim()) return 'Username is required';
    if (username.trim().length < 3) return 'Username must be at least 3 characters';
    if (usernameError) return usernameError;
    if (usernameChecking) return 'Checking username availability...';
    if (!pubgId.trim()) return 'PUBG ID is required';
    if (pubgId.trim().length < 3) return 'PUBG ID must be at least 3 characters';
    if (!pubgNickname.trim()) return 'PUBG Nickname is required';
    if (pubgNickname.trim().length < 2) return 'Nickname must be at least 2 characters';
    return null;
  };

  const handleFinish = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      await profileService.update(user.uid, {
        displayName: username.trim(),
        pubgId: pubgId.trim(),
        pubgNickname: pubgNickname.trim(),
        onboardingCompleted: true,
      });

      const updatedUser = { 
        ...user, 
        displayName: username.trim(),
        pubgId: pubgId.trim(), 
        pubgNickname: pubgNickname.trim(),
        onboardingCompleted: true 
      };
      setUser(updatedUser);
      setOnboardingCompleted();

      const role = updatedUser.role;
      if (role === 'admin') router.replace('/(admin)/dashboard' as never);
      else if (role === 'seller') router.replace('/(auth)/seller-approval' as never);
      else if (role === 'supplier') router.replace('/(supplier)/dashboard' as never);
      else router.replace('/(buyer)/dashboard' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      <TacticalGrid />
      <CornerReticles />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* Back button */}
          <TouchableOpacity
            className="mb-6 mt-2 self-start"
            onPress={() => router.back()}
          >
            <Text className="text-[#D4A017] text-sm font-bold uppercase">← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold uppercase mb-2">Set up PUBG profile</Text>
            <Text className="text-surface-300 text-xs leading-relaxed">
              Your PUBG ID and nickname help buyers and suppliers identify you in-game.
            </Text>
          </View>

          {/* Info card */}
          <View style={{ backgroundColor: 'rgba(212,160,23,0.06)', borderWidth: 1, borderColor: 'rgba(212,160,23,0.25)', borderRadius: 4 }} className="p-4 mb-6">
            <Text className="text-[#D4A017] text-xs font-bold uppercase mb-1">Where to find your PUBG ID?</Text>
            <Text className="text-surface-300 text-[10px] uppercase font-medium leading-relaxed">
              Open PUBG Mobile → Tap your avatar → Your numeric ID is shown below your nickname.
            </Text>
          </View>

          {/* Username field */}
          <View className="mb-5">
            <Text className="text-surface-300 text-xs uppercase font-bold mb-2">
              Username <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 2 }}
              className="text-white px-4 py-3 text-sm"
              value={username}
              onChangeText={(v) => {
                setUsername(v);
                if (error) setError(null);
              }}
              placeholder="e.g. UniqueSoldier"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            {usernameChecking && (
              <Text className="text-[#D4A017] text-[10px] uppercase font-bold mt-1.5">Checking availability...</Text>
            )}
            {!usernameChecking && usernameError && (
              <Text className="text-red-400 text-[10px] uppercase font-bold mt-1.5">{usernameError}</Text>
            )}
            {!usernameChecking && !usernameError && username.trim().length >= 3 && (
              <Text className="text-green-400 text-[10px] uppercase font-bold mt-1.5">✓ Username is available</Text>
            )}
            <Text className="text-surface-400 text-[10px] uppercase font-medium mt-1">Your unique display name in PUBG POP</Text>
          </View>

          {/* PUBG ID field */}
          <View className="mb-5">
            <Text className="text-surface-300 text-xs uppercase font-bold mb-2">
              PUBG ID <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 2 }}
              className="text-white px-4 py-3 text-sm"
              value={pubgId}
              onChangeText={(v) => {
                setPubgId(v);
                if (error) setError(null);
              }}
              placeholder="e.g. 5123456789"
              placeholderTextColor="#475569"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <Text className="text-surface-400 text-[10px] uppercase font-medium mt-1">Numeric ID from your PUBG profile</Text>
          </View>

          {/* PUBG Nickname field */}
          <View className="mb-6">
            <Text className="text-surface-300 text-xs uppercase font-bold mb-2">
              PUBG Nickname <Text className="text-red-400">*</Text>
            </Text>
            <TextInput
              style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 2 }}
              className="text-white px-4 py-3 text-sm"
              value={pubgNickname}
              onChangeText={(v) => {
                setPubgNickname(v);
                if (error) setError(null);
              }}
              placeholder="e.g. ProSniper99"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            <Text className="text-surface-400 text-[10px] uppercase font-medium mt-1">Your in-game display name</Text>
          </View>

          {/* Error */}
          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3 mb-4">
              <Text className="text-red-400 text-xs font-bold uppercase">{error}</Text>
            </View>
          )}

          {/* Finish button */}
          <TouchableOpacity
            style={{
              borderWidth: 1.5,
              borderColor: '#D4A017',
              backgroundColor: 'rgba(212,160,23,0.15)',
              borderRadius: 2,
              paddingVertical: 15,
              alignItems: 'center',
            }}
            onPress={handleFinish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#D4A017" />
            ) : (
              <Text className="text-[#D4A017] font-bold text-xs uppercase letter-spacing-[1]">Finish Setup</Text>
            )}
          </TouchableOpacity>

          <Text className="text-surface-400 text-[10px] uppercase font-medium text-center mt-4">
            You can update these details later from your profile.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
