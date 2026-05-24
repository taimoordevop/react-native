import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/shared/types';

/** Max ms to wait for Firestore profile fetch before giving up */
const FETCH_TIMEOUT_MS = 8_000;

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True once the user has completed role selection + PUBG profile setup */
  onboardingCompleted: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  onboardingCompleted: false,
});

/** Access auth state anywhere without subscribing to the full Zustand store */
export const useAuth = () => useContext(AuthContext);

/** Convenience hook — returns the full typed user or null */
export const useCurrentUser = (): UserProfile | null => useContext(AuthContext).user;

interface AuthProviderProps {
  children: ReactNode;
}

/** Wraps a promise with a timeout — rejects if not resolved within ms */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
}

/** Build a minimal fallback UserProfile from a FirebaseUser when Firestore is unavailable */
function buildFallbackProfile(firebaseUser: FirebaseUser): UserProfile {
  const now = { seconds: Date.now() / 1000, nanoseconds: 0 } as UserProfile['createdAt'];
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName ?? 'User',
    photoURL: firebaseUser.photoURL,
    phoneNumber: firebaseUser.phoneNumber,
    role: 'buyer',
    paymentDetails: null,
    pubgId: null,
    pubgNickname: null,
    pubgServer: null,
    bio: null,
    reputation: 0,
    totalPopSent: 0,
    totalPopReceived: 0,
    rating: 0,
    totalReviews: 0,
    totalSales: 0,
    totalEarnings: 0,
    isVerified: false,
    isBanned: false,
    onboardingCompleted: false,
    fcmToken: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, setError, signOut, user, isAuthenticated, isLoading } =
    useAuthStore();

  // Guard against calling setState after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    console.log('[AUTH] Subscribing to onAuthStateChanged...');

    // Guarantee loading resolves within 3s no matter what
    const safetyTimer = setTimeout(() => {
      if (!isMounted.current) return;
      console.warn('[AUTH] Safety timer fired — forcing isLoading=false');
      setLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted.current) return;

      if (!firebaseUser) {
        console.log('[AUTH] No Firebase session — will redirect to login');
        clearTimeout(safetyTimer);
        signOut();
        setLoading(false);
        return;
      }

      console.log('[AUTH] Firebase user detected:', firebaseUser.uid);

      try {
        console.log('[AUTH] Fetching Firestore profile...');
        const profile = await withTimeout(
          authService.getUserProfile(firebaseUser.uid),
          FETCH_TIMEOUT_MS,
        );

        if (!isMounted.current) return;
        clearTimeout(safetyTimer);

        if (profile) {
          console.log('[AUTH] Profile loaded — role:', profile.role, '| onboarding:', profile.onboardingCompleted);
          setUser(profile);
        } else {
          console.warn('[AUTH] No Firestore doc — using fallback profile');
          setUser(buildFallbackProfile(firebaseUser));
        }
      } catch (err) {
        if (!isMounted.current) return;
        clearTimeout(safetyTimer);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[AUTH] Profile fetch failed:', msg, '— using fallback');
        setUser(buildFallbackProfile(firebaseUser));
        setError(msg);
      }
    });

    return () => {
      console.log('[AUTH] Unsubscribing');
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [setUser, setLoading, setError, signOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        onboardingCompleted: user?.onboardingCompleted ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
