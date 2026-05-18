import Constants from 'expo-constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const {
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId,
} = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: firebaseApiKey ?? 'AIzaSyDnSkbhI0wFchVerYrRa7D6vHCarHsRqw4',
  authDomain: firebaseAuthDomain ?? 'seller-882b8.firebaseapp.com',
  projectId: firebaseProjectId ?? 'seller-882b8',
  storageBucket: firebaseStorageBucket ?? 'seller-882b8.firebasestorage.app',
  messagingSenderId: firebaseMessagingSenderId ?? '153534752766',
  appId: firebaseAppId ?? '1:153534752766:android:83c95588d112e2182302af',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const USE_EMULATOR = __DEV__ && false;

if (USE_EMULATOR) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;
