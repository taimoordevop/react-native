/** Minimal sync storage interface shared by MMKV and the in-memory fallback */
interface SyncStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

/** In-memory fallback used when MMKV native module is unavailable (e.g. Expo Go) */
function createMemoryStorage(): SyncStorage {
  const mem = new Map<string, string>();
  return {
    getString: (key) => mem.get(key),
    set: (key, value) => { mem.set(key, value); },
    delete: (key) => { mem.delete(key); },
  };
}

/**
 * MMKV is only available in native builds (expo run:android / expo run:ios).
 * Static `import` statements run BEFORE try/catch, so we use dynamic require()
 * here — this is the only way to safely catch the missing native module in Expo Go.
 */
function createStorage(): SyncStorage {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    return new MMKV({ id: 'pop-seller-storage', encryptionKey: 'pop-seller-secret' });
  } catch {
    console.warn('[STORAGE] MMKV unavailable — using in-memory fallback (Expo Go mode)');
    return createMemoryStorage();
  }
}

export const storage = createStorage();

export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  USER_PROFILE: 'user_profile',
  ONBOARDING_DONE: 'onboarding_done',
  THEME: 'theme',
  LOCALE: 'locale',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
