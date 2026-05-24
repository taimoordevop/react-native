import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';

import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useSubmitProof } from '@/features/orders/hooks/useOrders';
import { orderService } from '@/features/orders/services/orderService';

type Stage = 'guide' | 'recording' | 'preview' | 'details' | 'uploading';

const MAX_DURATION_S = 60;
const { width: SCREEN_W } = Dimensions.get('window');

const STEPS = [
  { icon: '🎮', text: 'Open PUBG Mobile on your phone' },
  { icon: '🔍', text: 'Search the Buyer PUBG ID' },
  { icon: '🎁', text: 'Send Unknown Cash / Gifts' },
  { icon: '⏹', text: 'Stop recording — upload here' },
];

export default function ProofUploadScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const submitProof = useSubmitProof();

  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stage, setStage] = useState<Stage>('guide');
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Details stage state
  const [diamondsSent, setDiamondsSent] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Fallback URL mode
  const [useUrlMode, setUseUrlMode] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-stop at 60s
  useEffect(() => {
    if (elapsed >= MAX_DURATION_S && isRecording) {
      handleStopRecording();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, isRecording]);

  const ensurePermissions = async () => {
    let cam = camPerm;
    let mic = micPerm;
    if (!cam?.granted) cam = await requestCamPerm();
    if (!mic?.granted) mic = await requestMicPerm();
    return cam?.granted && mic?.granted;
  };

  const handleStartRecording = async () => {
    const ok = await ensurePermissions();
    if (!ok) {
      Alert.alert(
        'Permissions Required',
        'Camera and microphone access are needed to record proof.',
      );
      return;
    }
    setStage('recording');
    setElapsed(0);
    setIsRecording(true);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

    try {
      const result = await cameraRef.current?.recordAsync({
        maxDuration: MAX_DURATION_S,
      });
      if (result?.uri) {
        setRecordedUri(result.uri);
        setStage('preview');
      }
    } catch {
      setStage('guide');
      setIsRecording(false);
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleStopRecording = () => {
    cameraRef.current?.stopRecording();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleRetake = () => {
    setRecordedUri(null);
    setElapsed(0);
    setStage('guide');
  };

  const handleUseVideo = () => {
    setStage('details');
    setDetailsError(null);
  };

  const handleSubmit = async () => {
    if (!user || !orderId) return;

    const diamonds = parseInt(diamondsSent.replace(/,/g, ''), 10);
    if (!diamonds || diamonds < 1) {
      setDetailsError('Enter how many POP (diamonds) were sent.');
      return;
    }

    if (useUrlMode) {
      if (!manualUrl.startsWith('http')) {
        setDetailsError('URL must start with http:// or https://');
        return;
      }
      submitProof.mutate(
        {
          orderId,
          supplierId: user.uid,
          url: manualUrl.trim(),
          diamondsSent: diamonds,
          type: 'screenshot',
          notes: notes.trim() || undefined,
        },
        {
          onSuccess: () =>
            Alert.alert('Proof Submitted', 'Seller will review and verify.', [
              { text: 'OK', onPress: () => router.back() },
            ]),
          onError: (e) =>
            setDetailsError(e instanceof Error ? e.message : 'Submission failed'),
        },
      );
      return;
    }

    if (!recordedUri) return;

    try {
      setStage('uploading');
      setUploadProgress(0);

      const url = await orderService.uploadVideoProof(
        orderId,
        user.uid,
        recordedUri,
        'mp4',
        (pct) => setUploadProgress(pct),
      );

      submitProof.mutate(
        {
          orderId,
          supplierId: user.uid,
          url,
          diamondsSent: diamonds,
          type: 'video',
          notes: notes.trim() || undefined,
        },
        {
          onSuccess: () =>
            Alert.alert(
              'Proof Submitted! ✓',
              `Video uploaded. ${diamonds.toLocaleString()} POP proof recorded.`,
              [{ text: 'OK', onPress: () => router.back() }],
            ),
          onError: (e) => {
            setStage('details');
            setDetailsError(e instanceof Error ? e.message : 'Submission failed');
          },
        },
      );
    } catch (e) {
      setStage('details');
      setDetailsError(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  // ── Guide screen ──────────────────────────────────────────────────────────
  if (stage === 'guide') {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-primary-400 text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1">Submit POP Proof</Text>
        </View>

        <ScrollView
          /* eslint-disable-next-line react-native/no-inline-styles */
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          <View className="items-center mb-6">
            <Text className="text-4xl mb-3">🎬</Text>
            <Text className="text-white text-xl font-bold text-center mb-2">
              Record Your Screen
            </Text>
            <Text className="text-surface-300 text-sm text-center leading-5">
              Record a short screen video (max 60 sec) showing you sending the POP inside PUBG
              Mobile. This proves delivery to the buyer.
            </Text>
          </View>

          {/* Steps */}
          <View className="bg-surface-100 rounded-2xl p-4 mb-6">
            <Text className="text-white font-semibold mb-4">Follow These Steps:</Text>
            {STEPS.map((step, i) => (
              <View key={i} className="flex-row items-start mb-3">
                <View className="bg-primary-500/20 rounded-full w-8 h-8 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-base">{step.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-surface-300 text-sm leading-5">
                    <Text className="text-primary-400 font-semibold">Step {i + 1}: </Text>
                    {step.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6">
            <Text className="text-yellow-400 font-semibold mb-2">⚡ Tips</Text>
            <Text className="text-surface-300 text-sm leading-5">
              • Make sure the PUBG ID is visible on screen.{'\n'}
              • Show the gift/send animation clearly.{'\n'}
              • Keep video under 60 seconds.{'\n'}
              • Good lighting = clearer proof.
            </Text>
          </View>

          {/* Primary action */}
          <TouchableOpacity
            className="bg-purple-600 rounded-2xl py-4 items-center mb-3"
            onPress={handleStartRecording}
          >
            <Text className="text-white font-bold text-base">🎥 Start Recording Now</Text>
          </TouchableOpacity>

          {/* Fallback — paste URL */}
          <TouchableOpacity
            className="border border-surface-200 rounded-2xl py-3 items-center"
            onPress={() => { setUseUrlMode(true); setStage('details'); }}
          >
            <Text className="text-surface-300 text-sm">Paste a video/screenshot link instead</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Recording screen ──────────────────────────────────────────────────────
  if (stage === 'recording') {
    const progress = elapsed / MAX_DURATION_S;
    const remaining = MAX_DURATION_S - elapsed;
    return (
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          /* eslint-disable-next-line react-native/no-inline-styles */
          style={{ flex: 1 }}
          facing="back"
          mode="video"
          videoQuality="720p"
        >
          {/* Overlay — timer + instructions */}
          <View className="flex-1 justify-between p-4">
            {/* Top bar */}
            <View className="flex-row justify-between items-center pt-8">
              <View className="bg-red-500 rounded-full px-3 py-1 flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-white" />
                <Text className="text-white font-bold text-sm">REC</Text>
              </View>
              <View
                className={`rounded-full px-4 py-1 ${
                  remaining <= 10 ? 'bg-red-500/80' : 'bg-black/50'
                }`}
              >
                <Text className="text-white font-bold text-lg">
                  {String(Math.floor(remaining / 60)).padStart(2, '0')}:
                  {String(remaining % 60).padStart(2, '0')}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="h-1 bg-white/20 rounded-full mx-2">
              <View
                className="h-1 bg-red-400 rounded-full"
                /* eslint-disable-next-line react-native/no-inline-styles */
                style={{ width: `${progress * 100}%` }}
              />
            </View>

            {/* Instruction overlay */}
            <View className="bg-black/60 rounded-2xl p-4 mb-4 mx-2">
              <Text className="text-white text-sm text-center leading-5">
                🎮 Show PUBG ID → Search → Send Gifts → Return here
              </Text>
            </View>

            {/* Stop button */}
            <TouchableOpacity
              onPress={handleStopRecording}
              className="self-center bg-red-500 rounded-full w-20 h-20 items-center justify-center mb-8 border-4 border-white"
            >
              <View className="w-8 h-8 bg-white rounded-sm" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // ── Preview screen ────────────────────────────────────────────────────────
  if (stage === 'preview' && recordedUri) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
          <TouchableOpacity onPress={handleRetake} className="mr-3">
            <Text className="text-primary-400 text-base">← Retake</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1">Preview Recording</Text>
        </View>

        <View className="flex-1 p-4">
          {/* Video preview */}
          <View className="rounded-2xl overflow-hidden mb-4 bg-black">
            <Video
              source={{ uri: recordedUri }}
              /* eslint-disable-next-line react-native/no-inline-styles */
              style={{ width: SCREEN_W - 32, height: (SCREEN_W - 32) * 0.56 }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={false}
              isLooping={false}
            />
          </View>

          <View className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3 mb-4">
            <Text className="text-green-400 text-sm">
              ✓ {elapsed} second{elapsed !== 1 ? 's' : ''} recorded. Looks good? Tap Use This
              Video.
            </Text>
          </View>

          <View className="gap-3">
            <TouchableOpacity
              className="bg-purple-600 rounded-2xl py-4 items-center"
              onPress={handleUseVideo}
            >
              <Text className="text-white font-bold text-base">✓ Use This Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-surface-100 rounded-2xl py-4 items-center"
              onPress={handleRetake}
            >
              <Text className="text-white font-semibold">↺ Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Details screen ────────────────────────────────────────────────────────
  if (stage === 'details') {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 py-3 border-b border-surface-200">
          <TouchableOpacity
            onPress={() => useUrlMode ? setUseUrlMode(false) || setStage('guide') : setStage('preview')}
            className="mr-3"
          >
            <Text className="text-primary-400 text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1">Add Details</Text>
        </View>

        <ScrollView
          /* eslint-disable-next-line react-native/no-inline-styles */
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {useUrlMode ? (
            <View className="mb-4">
              <Text className="text-surface-300 text-sm mb-2">Video / Screenshot URL *</Text>
              <TextInput
                className="bg-surface-100 text-white rounded-xl px-4 py-3 text-sm"
                value={manualUrl}
                onChangeText={setManualUrl}
                placeholder="https://drive.google.com/... or https://youtu.be/..."
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          ) : (
            <View className="bg-surface-100 rounded-2xl p-3 mb-4 flex-row items-center gap-3">
              <Text className="text-2xl">🎬</Text>
              <Text className="text-green-400 text-sm font-semibold flex-1">
                Video recorded ({elapsed}s) — ready to upload
              </Text>
            </View>
          )}

          {/* Diamonds sent */}
          <View className="mb-4">
            <Text className="text-surface-300 text-sm mb-2">POP Diamonds Sent *</Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-3 text-base"
              value={diamondsSent}
              onChangeText={(v) => { setDiamondsSent(v); setDetailsError(null); }}
              placeholder="e.g. 50000"
              placeholderTextColor="#475569"
              keyboardType="numeric"
            />
            <Text className="text-surface-400 text-xs mt-1">
              Enter the total number of diamonds/POP units you sent.
            </Text>
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-surface-300 text-sm mb-2">Notes (optional)</Text>
            <TextInput
              className="bg-surface-100 text-white rounded-xl px-4 py-3 text-sm"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Sent in 2 batches of 25k each"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              /* eslint-disable-next-line react-native/no-inline-styles */
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          {detailsError && (
            <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4">
              <Text className="text-red-400 text-sm">{detailsError}</Text>
            </View>
          )}

          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${
              submitProof.isPending ? 'bg-surface-200' : 'bg-purple-600'
            }`}
            onPress={handleSubmit}
            disabled={submitProof.isPending}
          >
            {submitProof.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                {useUrlMode ? 'Submit Proof Link' : '⬆ Upload Proof Video'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Uploading screen ──────────────────────────────────────────────────────
  if (stage === 'uploading') {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-4xl mb-4">⬆️</Text>
        <Text className="text-white text-lg font-bold mb-2">Uploading Video…</Text>
        <Text className="text-surface-300 text-sm mb-6 text-center">
          Please keep the app open. This may take a moment depending on your connection.
        </Text>
        {/* Progress bar */}
        <View className="w-full h-3 bg-surface-200 rounded-full overflow-hidden mb-3">
          <View
            className="h-3 bg-purple-500 rounded-full"
            /* eslint-disable-next-line react-native/no-inline-styles */
            style={{ width: `${uploadProgress}%` }}
          />
        </View>
        <Text className="text-surface-300 text-sm">{uploadProgress}% complete</Text>
      </SafeAreaView>
    );
  }

  return null;
}
