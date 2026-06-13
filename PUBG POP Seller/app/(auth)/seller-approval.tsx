import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { approvalService } from '@/features/profile/services/approvalService';

type CameraStage = 'form' | 'camera' | 'preview';

export default function SellerApprovalScreen() {
  const { user, setUser, signOut } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Form State
  const [cnic, setCnic] = useState('');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  
  // UX State
  const [cameraStage, setCameraStage] = useState<CameraStage>('form');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      signOut();
      router.replace('/(auth)/login');
    } catch (err) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const startCamera = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            'Camera Permission Required',
            'We need access to your camera to take a selfie holding your CNIC card. Please enable it in device settings if prompt was declined.'
          );
          return;
        }
      }
      setCameraStage('camera');
    } catch (err) {
      Alert.alert('Permission Error', 'Failed to request camera permission.');
    }
  };

  const takeSelfie = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.75,
      });
      if (photo?.uri) {
        setSelfieUri(photo.uri);
        setCameraStage('preview');
      }
    } catch (err) {
      Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleRetake = () => {
    setSelfieUri(null);
    setCameraStage('camera');
  };

  const handleUsePhoto = () => {
    setCameraStage('form');
  };

  const validate = (): string | null => {
    if (!cnic.trim()) return 'CNIC Number is required';
    // CNIC validation pattern for Pakistan: e.g. 37405-1234567-8 or 13 digits
    const cleanCnic = cnic.replace(/[^0-9]/g, '');
    if (cleanCnic.length !== 13) {
      return 'CNIC must be exactly 13 digits long';
    }
    if (!selfieUri) return 'Please capture a selfie holding your CNIC card';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      // Submit request to Firestore and upload Selfie
      await approvalService.submitSellerApproval(
        user.uid,
        user.displayName ?? 'Seller',
        user.email,
        cnic.trim(),
        selfieUri!,
        (pct) => setProgress(pct)
      );

      // Update local Zustand store so layouts are updated instantly
      setUser({
        ...user,
        sellerApprovalStatus: 'pending',
        cnicNumber: cnic.trim(),
        cnicSelfieUrl: selfieUri!,
      });

      Alert.alert(
        'Request Submitted! 🎉',
        'Your Seller approval request has been successfully submitted and is under review.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(seller)/dashboard');
            },
          },
        ]
      );
    } catch (submitErr) {
      setError(submitErr instanceof Error ? submitErr.message : 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCnic = (text: string) => {
    // Automatically format CNIC as 12345-1234567-1
    const clean = text.replace(/[^0-9]/g, '');
    let formatted = clean;
    if (clean.length > 5 && clean.length <= 12) {
      formatted = `${clean.slice(0, 5)}-${clean.slice(5)}`;
    } else if (clean.length > 12) {
      formatted = `${clean.slice(0, 5)}-${clean.slice(5, 12)}-${clean.slice(12, 13)}`;
    }
    setCnic(formatted);
    if (error) setError(null);
  };

  // ───── STAGE: CAMERA VIEW ─────
  if (cameraStage === 'camera') {
    return (
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          /* eslint-disable-next-line react-native/no-inline-styles */
          style={{ flex: 1 }}
          facing="front"
          mode="picture"
        >
          {/* Overlay elements */}
          <SafeAreaView className="flex-1 justify-between p-6">
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                onPress={() => setCameraStage('form')}
                className="bg-black/50 p-3 rounded-full"
              >
                <Text className="text-white text-sm font-semibold">✕ Close</Text>
              </TouchableOpacity>
              <Text className="text-white font-bold text-sm bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                Selfie Mode
              </Text>
            </View>

            {/* Guide frame indicator */}
            <View className="items-center">
              <View className="w-72 h-96 rounded-full border-2 border-dashed border-white/60 items-center justify-center bg-black/10">
                <Text className="text-white/80 text-xs text-center px-4 leading-4">
                  Hold CNIC card next to your face{'\n'}inside this frame
                </Text>
              </View>
            </View>

            {/* Capture button */}
            <TouchableOpacity
              onPress={takeSelfie}
              className="self-center bg-white rounded-full w-20 h-20 items-center justify-center border-4 border-yellow-500"
            >
              <View className="w-14 h-14 bg-yellow-500 rounded-full" />
            </TouchableOpacity>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // ───── STAGE: PREVIEW PHOTO ─────
  if (cameraStage === 'preview' && selfieUri) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
          <TouchableOpacity onPress={handleRetake} className="mr-3">
            <Text className="text-primary-400 text-base">← Retake</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1">Preview Selfie</Text>
        </View>

        <View className="flex-1 p-6 justify-between">
          <View className="flex-1 justify-center items-center">
            <Image
              source={{ uri: selfieUri }}
              className="w-full h-96 rounded-2xl bg-black"
              resizeMode="cover"
            />
            <Text className="text-surface-400 text-xs mt-3 text-center leading-4">
              Ensure your CNIC number and your face are completely clear and legible.
            </Text>
          </View>

          <View className="gap-3 mt-4">
            <TouchableOpacity
              onPress={handleUsePhoto}
              className="bg-yellow-500 rounded-xl py-4 items-center"
            >
              <Text className="text-black font-bold text-base">✓ Use This Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRetake}
              className="bg-surface-100 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold">↺ Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ───── STAGE: REGISTRATION FORM ─────
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Info Bar */}
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-white text-3xl font-bold">Seller Verification</Text>
            <TouchableOpacity
              onPress={handleSignOut}
              className="bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl"
            >
              <Text className="text-red-400 text-xs font-semibold">Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Form Banner */}
          {user?.sellerApprovalStatus === 'rejected' ? (
            <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
              <Text className="text-red-400 font-bold mb-1">❌ Verification Rejected</Text>
              <Text className="text-surface-300 text-sm leading-5">
                {user.approvalNotes || 'Your previous submission did not meet our guidelines. Please update your details and submit again.'}
              </Text>
            </View>
          ) : (
            <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6">
              <Text className="text-yellow-400 font-bold mb-1">🛡️ Seller Status Security Check</Text>
              <Text className="text-surface-300 text-xs leading-4">
                To post requests as a Middleman, verify your identity. Submit a valid CNIC card selfie to request review.
              </Text>
            </View>
          )}

          {loading ? (
            /* Uploading Stage */
            <View className="flex-1 items-center justify-center py-10">
              <ActivityIndicator color="#eab308" size="large" className="mb-4" />
              <Text className="text-white text-lg font-bold">Uploading Request Details...</Text>
              <Text className="text-surface-300 text-sm mb-4">Please do not close the app.</Text>
              <View className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
                <View
                  className="h-2 bg-yellow-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-surface-300 text-xs mt-2">{progress}% complete</Text>
            </View>
          ) : (
            /* Main Form Input fields */
            <View className="gap-6">
              {/* CNIC Number */}
              <View>
                <Text className="text-surface-300 text-sm font-semibold mb-2">CNIC Number *</Text>
                <TextInput
                  value={cnic}
                  onChangeText={formatCnic}
                  placeholder="xxxxx-xxxxxxx-x"
                  placeholderTextColor="#475569"
                  className="bg-surface-100 text-white rounded-xl px-4 py-4 text-base"
                  keyboardType="numeric"
                  maxLength={15}
                />
                <Text className="text-surface-400 text-xs mt-1">13-digit Pakistani National Identity Card number</Text>
              </View>

              {/* CNIC Selfie Capture Area */}
              <View>
                <Text className="text-surface-300 text-sm font-semibold mb-2">CNIC Selfie *</Text>
                {selfieUri ? (
                  <View className="relative w-full h-48 rounded-2xl overflow-hidden bg-surface-100 border border-surface-200">
                    <Image source={{ uri: selfieUri }} className="w-full h-full" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={startCamera}
                      className="absolute right-3 bottom-3 bg-black/60 px-3 py-1.5 rounded-xl border border-white/20"
                    >
                      <Text className="text-white text-xs font-semibold">Change Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={startCamera}
                    className="w-full h-48 rounded-2xl border-2 border-dashed border-surface-200 bg-surface-100 items-center justify-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-4xl mb-2">📸</Text>
                    <Text className="text-white text-sm font-semibold">Take CNIC Selfie</Text>
                    <Text className="text-surface-400 text-xs mt-1 px-6 text-center leading-4">
                      Hold CNIC card clearly beside your face so all details are visible.
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {error && (
                <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <Text className="text-red-400 text-sm">{error}</Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmit}
                className="bg-yellow-500 rounded-xl py-4 items-center mt-4"
              >
                <Text className="text-black font-bold text-base">Submit Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
