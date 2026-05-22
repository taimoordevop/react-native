const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getAppName = () => {
  if (IS_DEV) return 'POP Seller (Dev)';
  if (IS_PREVIEW) return 'POP Seller (Preview)';
  return 'POP Seller';
};

const getBundleId = () => {
  if (IS_DEV) return 'popselling.com.dev';
  if (IS_PREVIEW) return 'popselling.com.preview';
  return 'popselling.com';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'pubg-pop-seller',
    version: '1.0.0',
    orientation: 'portrait',
    // icon: './src/assets/icon.png', // TODO: Add app icon
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    // splash: {
    //   image: './src/assets/splash.png',
    //   resizeMode: 'contain',
    //   backgroundColor: '#0f172a',
    // },
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
          'POP Seller uses the camera to capture proof of delivery and item photos.',
        NSMicrophoneUsageDescription:
          'POP Seller uses the microphone for video proof of delivery.',
        NSPhotoLibraryUsageDescription:
          'POP Seller needs access to your photo library to upload item images.',
        NSPhotoLibraryAddUsageDescription:
          'POP Seller saves photos of your items and orders.',
      },
    },
    android: {
      // adaptiveIcon: {
      //   foregroundImage: './src/assets/adaptive-icon.png',
      //   backgroundColor: '#0f172a',
      // },
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
      // favicon: './src/assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      [
        'expo-camera',
        {
          cameraPermission:
            'POP Seller uses the camera to capture proof of delivery and item photos.',
          microphonePermission:
            'POP Seller uses the microphone for video proof of delivery.',
          recordAudioAndroid: true,
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'Allow POP Seller to access your photos.',
          savePhotosPermission: 'Allow POP Seller to save photos.',
          isAccessMediaLocationEnabled: true,
        },
      ],
      'expo-font',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0f172a',
          // image: './src/assets/splash.png', // TODO: Add splash screen
          resizeMode: 'contain',
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
      eas: {
        projectId: 'your-eas-project-id',
      },
    },
  },
};
