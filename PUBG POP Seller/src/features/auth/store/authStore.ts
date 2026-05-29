import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { zustandMMKVStorage } from '@/lib/zustandStorage';
import type { UserProfile } from '@/shared/types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /** Whether the user chose to stay signed in across app restarts. */
  rememberMe: boolean;
  // Actions
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRememberMe: (remember: boolean) => void;
  /** Mark onboarding as done — updates the local user object immediately */
  setOnboardingCompleted: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      rememberMe: true,
      setUser: (user) => {
        console.log('[STORE] setUser — uid:', user?.uid ?? 'null', '| role:', user?.role ?? 'none');
        set({ user, isAuthenticated: !!user, isLoading: false, error: null });
      },
      setLoading: (isLoading) => {
        console.log('[STORE] setLoading:', isLoading);
        set({ isLoading });
      },
      setError: (error) => {
        if (error) console.error('[STORE] setError:', error);
        set({ error, isLoading: false });
      },
      setRememberMe: (remember) => {
        set({ rememberMe: remember });
      },
      setOnboardingCompleted: () =>
        set((state) =>
          state.user
            ? { user: { ...state.user, onboardingCompleted: true } }
            : {},
        ),
      signOut: () => {
        console.log('[STORE] signOut called');
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
      // Never persist isLoading or error — they must reset on every cold start
      // so the Firebase auth check always runs before index.tsx redirects
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => (state) => {
        // After MMKV hydration force isLoading=true so we wait for Firebase
        if (state) state.isLoading = true;
      },
    },
  ),
);
