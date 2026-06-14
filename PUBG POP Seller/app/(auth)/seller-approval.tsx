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

export default function SellerApprovalScreen() {
  const { user, setUser, signOut } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [cnic, setCnic] = useState('');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  
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

      await approvalService.submitSellerApproval(
        user.uid,
        user.displayName ?? 'Seller',
        user.email,
        cnic.trim(),
        selfieUri!,
        (pct) => setProgress(pct)
      );

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

  if (cameraStage === 'camera') {
    return (
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="front"
          mode="picture"
        >
          <SafeAreaView className="flex-1 justify-between p-6">
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                onPress={() => setCameraStage('form')}
                style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 2 }}
                className="px-4 py-2"
              >
                <Text className="text-white text-xs font-bold uppercase">✕ Close</Text>
              </TouchableOpacity>
              <Text className="text-[#D4A017] font-bold text-xs bg-yellow-500/10 px-3 py-1.5 rounded border border-yellow-500/20 uppercase">
                Selfie Mode
              </Text>
            </View>

            <View className="items-center">
              <View style={{ borderColor: '#D4A017' }} className="w-72 h-96 rounded-full border-2 border-dashed items-center justify-center bg-black/10">
                <Text className="text-white/80 text-xxs text-center px-4 leading-4 uppercase font-bold">
                  Hold CNIC card next to your face{'\n'}inside this frame
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={takeSelfie}
              className="self-center bg-white rounded-full w-20 h-20 items-center justify-center border-4 border-[#D4A017]"
            >
              <View className="w-14 h-14 bg-[#D4A017] rounded-full" />
            </TouchableOpacity>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  if (cameraStage === 'preview' && selfieUri) {
    return (
      <SafeAreaView className="flex-1 bg-[#090d16] relative">
        <TacticalGrid />
        <CornerReticles />

        <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
          <TouchableOpacity onPress={handleRetake} className="mr-3">
            <Text className="text-[#D4A017] text-base font-bold uppercase">← Retake</Text>
          </TouchableOpacity>
          <Text className="text-white text-base font-bold flex-1 uppercase">Preview Selfie</Text>
        </View>

        <View className="flex-1 p-6 justify-between">
          <View className="flex-1 justify-center items-center">
            <Image
              source={{ uri: selfieUri }}
              style={{ borderWidth: 1.5, borderColor: '#D4A017', borderRadius: 4 }}
              className="w-full h-96 bg-black"
              resizeMode="cover"
            />
            <Text className="text-surface-400 text-[10px] uppercase font-bold mt-4 text-center leading-4">
              Ensure your CNIC number and your face are completely clear and legible.
            </Text>
          </View>

          <View className="gap-3 mt-4">
            <TouchableOpacity
              style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
              className="py-4 items-center"
              onPress={handleUsePhoto}
            >
              <Text className="text-[#D4A017] font-bold text-xs uppercase">✓ Use This Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}
              className="py-4 items-center"
              onPress={handleRetake}
            >
              <Text className="text-white font-bold text-xs uppercase">↺ Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      <TacticalGrid />
      <CornerReticles />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Info Bar */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-2xl font-bold uppercase">Seller Verification</Text>
            <TouchableOpacity
              onPress={handleSignOut}
              style={{ borderWidth: 1, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 2 }}
              className="px-3 py-1.5"
            >
              <Text className="text-[#ef4444] text-[10px] font-bold uppercase">Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Form Banner */}
          {user?.sellerApprovalStatus === 'rejected' ? (
            <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.25)', borderRadius: 4 }} className="p-4 mb-6">
              <Text style={{ letterSpacing: 0.5 }} className="text-red-400 font-bold text-xs uppercase mb-1.5">❌ Verification Rejected</Text>
              <Text className="text-surface-300 text-xs leading-relaxed">
                {user.approvalNotes || 'Your previous submission did not meet our guidelines. Please update your details and submit again.'}
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: 'rgba(212,160,23,0.06)', borderWidth: 1.5, borderColor: 'rgba(212,160,23,0.25)', borderRadius: 4 }} className="p-4 mb-6">
              <Text style={{ letterSpacing: 0.5 }} className="text-[#D4A017] font-bold text-xs uppercase mb-1.5">🛡️ Seller Status Security Check</Text>
              <Text className="text-surface-300 text-[10px] uppercase font-medium leading-normal">
                To post requests as a Middleman, verify your identity. Submit a valid CNIC card selfie to request review.
              </Text>
            </View>
          )}

          {loading ? (
            /* Uploading Stage */
            <View className="flex-1 items-center justify-center py-10">
              <ActivityIndicator color="#D4A017" size="large" className="mb-4" />
              <Text className="text-white text-sm font-bold uppercase mb-1">Uploading Request Details...</Text>
              <Text className="text-surface-300 text-xs mb-6 uppercase font-medium">Please do not close the app.</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} className="w-full h-2 rounded-full overflow-hidden">
                <View
                  className="h-2 bg-[#D4A017] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-[#D4A017] text-xs font-bold uppercase mt-3">{progress}% complete</Text>
            </View>
          ) : (
            /* Main Form Input fields */
            <View className="gap-6">
              {/* CNIC Number */}
              <View>
                <Text className="text-surface-300 text-xs font-bold uppercase mb-2">CNIC Number *</Text>
                <TextInput
                  value={cnic}
                  onChangeText={formatCnic}
                  placeholder="xxxxx-xxxxxxx-x"
                  placeholderTextColor="#475569"
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 2 }}
                  className="text-white px-4 py-3 text-sm"
                  keyboardType="numeric"
                  maxLength={15}
                />
                <Text className="text-surface-400 text-[10px] uppercase font-medium mt-1">13-digit Pakistani National Identity Card number</Text>
              </View>

              {/* CNIC Selfie Capture Area */}
              <View>
                <Text className="text-surface-300 text-xs font-bold uppercase mb-2">CNIC Selfie *</Text>
                {selfieUri ? (
                  <View style={{ backgroundColor: 'rgba(30,41,59,0.25)', borderWidth: 1, borderColor: 'rgba(212,160,23,0.15)', borderRadius: 4 }} className="relative w-full h-48 overflow-hidden">
                    <Image source={{ uri: selfieUri }} className="w-full h-full" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={startCamera}
                      style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 2 }}
                      className="absolute right-3 bottom-3 px-3 py-1.5"
                    >
                      <Text className="text-white text-[10px] font-bold uppercase">Change Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={startCamera}
                    style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1.5, borderColor: 'rgba(212, 160, 23, 0.15)', borderStyle: 'dashed', borderRadius: 4 }}
                    className="w-full h-48 items-center justify-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-3xl mb-2">📸</Text>
                    <Text className="text-white text-xs font-bold uppercase">Take CNIC Selfie</Text>
                    <Text className="text-surface-400 text-[10px] uppercase font-medium mt-1 px-6 text-center leading-relaxed">
                      Hold CNIC card clearly beside your face so all details are visible.
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {error && (
                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.25)' }} className="p-3">
                  <Text className="text-red-400 text-xs font-bold uppercase">{error}</Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.15)', borderRadius: 2 }}
                onPress={handleSubmit}
                className="py-4 items-center mt-4"
              >
                <Text className="text-[#D4A017] font-bold text-xs uppercase letter-spacing-[1]">Submit Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
