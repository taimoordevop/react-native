import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { COLLECTION } from '@/constants';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/shared/types';

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
    defaultCommissionPer10k: 40,
    createdAt: now,
    updatedAt: now,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, setError, signOut, user, isAuthenticated, isLoading, rememberMe } =
    useAuthStore();

  const isFirstLoad = useRef(true);

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

    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted.current) return;

      // Clean up previous document listener if any
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (!firebaseUser) {
        console.log('[AUTH] No Firebase session — will redirect to login');
        clearTimeout(safetyTimer);
        signOut();
        setLoading(false);
        isFirstLoad.current = false;
        return;
      }

      console.log('[AUTH] Firebase user detected:', firebaseUser.uid);

      // If the user chose not to be remembered, clear the persisted session
      // ONLY on first app launch so they can log in and use their dashboard.
      if (isFirstLoad.current && !rememberMe) {
        console.log('[AUTH] First launch + rememberMe is false — clearing persisted session.');
        isFirstLoad.current = false;
        clearTimeout(safetyTimer);
        await authService.signOut();
        return;
      }

      isFirstLoad.current = false;

      // Set up real-time listener for profile changes
      const docRef = doc(db, COLLECTION.USERS, firebaseUser.uid);
      unsubscribeDoc = onSnapshot(
        docRef,
        async (snap) => {
          if (!isMounted.current) return;
          clearTimeout(safetyTimer);

          if (snap.exists()) {
            const profile = { id: snap.id, ...snap.data() } as UserProfile;
            console.log('[AUTH] Profile real-time update — role:', profile.role, '| isBanned:', profile.isBanned);

            if (profile.isBanned) {
              console.warn('[AUTH] Banned user detected — signing out');
              if (unsubscribeDoc) {
                unsubscribeDoc();
                unsubscribeDoc = null;
              }
              await authService.signOut();
              signOut();
              Alert.alert(
                'Account Blocked',
                'Your account has been blocked by the administrator. Please contact support.',
                [{ text: 'OK' }]
              );
              return;
            }

            setUser(profile);
          } else {
            // Document does not exist in Firestore. Check if this is a brand new signup in progress.
            const metadata = firebaseUser.metadata;
            const creationTime = new Date(metadata.creationTime || 0).getTime();
            const now = Date.now();
            const isBrandNew = (now - creationTime) < 30_000; // 30 seconds threshold

            if (!isBrandNew) {
              console.warn('[AUTH] Firestore user profile was deleted — signing out');
              if (unsubscribeDoc) {
                unsubscribeDoc();
                unsubscribeDoc = null;
              }
              await authService.signOut();
              signOut();
              Alert.alert(
                'Account Deleted',
                'Your account has been deleted by the administrator.',
                [{ text: 'OK' }]
              );
              return;
            }

            console.warn('[AUTH] No Firestore doc for new user — using fallback profile');
            setUser(buildFallbackProfile(firebaseUser));
          }
        },
        async (err) => {
          console.error('[AUTH] Profile listener error:', err);
          if (!isMounted.current) return;
          clearTimeout(safetyTimer);

          // If listener fails because of permissions (e.g. they were deleted or blocked and rules prevent read), boot them
          if (err.code === 'permission-denied') {
            console.warn('[AUTH] Profile permission denied — assuming banned/deleted');
            if (unsubscribeDoc) {
              unsubscribeDoc();
              unsubscribeDoc = null;
            }
            await authService.signOut();
            signOut();
            Alert.alert(
              'Session Terminated',
              'Your account has been deactivated, deleted, or blocked.',
              [{ text: 'OK' }]
            );
            return;
          }

          // Use fallback if no user exists locally
          const currentStoreUser = useAuthStore.getState().user;
          if (!currentStoreUser) {
            setUser(buildFallbackProfile(firebaseUser));
          }
        }
      );
    });

    return () => {
      console.log('[AUTH] Unsubscribing');
      clearTimeout(safetyTimer);
      unsubscribe();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, [setUser, setLoading, setError, signOut, rememberMe]);

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
