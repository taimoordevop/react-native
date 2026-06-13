const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getAppName = () => {
  if (IS_DEV) return 'PUBG MART (Dev)';
  if (IS_PREVIEW) return 'PUBG MART (Preview)';
  return 'PUBG MART';
};

const getBundleId = () => {
  return 'popselling.com';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'pubg-mart',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './src/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0f172a',
    },
    androidStatusBar: {
      backgroundColor: '#0f172a',
      translucent: true,
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: getBundleId(),
      // googleServicesFile: './GoogleService-Info.plist', // TODO: Add iOS Firebase config
      infoPlist: {
        NSCameraUsageDescription:
          'PUBG MART uses the camera to capture proof of delivery and item photos.',
        NSMicrophoneUsageDescription:
          'PUBG MART uses the microphone for video proof of delivery.',
        NSPhotoLibraryUsageDescription:
          'PUBG MART needs access to your photo library to upload item images.',
        NSPhotoLibraryAddUsageDescription:
          'PUBG MART saves photos of your items and orders.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/assets/adaptive-icon.png',
        backgroundColor: '#0f172a',
      },
      package: getBundleId(),
      googleServicesFile: './google-services.json',
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
    },
    web: {
      favicon: './src/assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      [
        'expo-camera',
        {
          cameraPermission:
            'PUBG MART uses the camera to capture proof of delivery and item photos.',
          microphonePermission:
            'PUBG MART uses the microphone for video proof of delivery.',
          recordAudioAndroid: true,
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'Allow PUBG MART to access your photos.',
          savePhotosPermission: 'Allow PUBG MART to save photos.',
          isAccessMediaLocationEnabled: true,
        },
      ],
      'expo-font',
      '@react-native-google-signin/google-signin',
      [
        'react-native-fbsdk-next',
        {
          appID: process.env.FACEBOOK_APP_ID || '1234567890',
          clientToken: process.env.FACEBOOK_CLIENT_TOKEN || 'mock_client_token',
          displayName: 'PUBG MART',
          scheme: 'fb' + (process.env.FACEBOOK_APP_ID || '1234567890'),
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    scheme: 'popseller',
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      facebookAppId: process.env.FACEBOOK_APP_ID,
      facebookClientToken: process.env.FACEBOOK_CLIENT_TOKEN,
      eas: {
        projectId: "de9cd416-e6be-4ffe-8510-a5473b012226"
      },
    },
  },
};
