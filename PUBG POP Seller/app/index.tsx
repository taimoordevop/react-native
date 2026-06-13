import { Redirect, useRootNavigationState } from 'expo-router';
import { useState } from 'react';

import { useAuthStore } from '@/features/auth/store/authStore';
import { LoadingScreen, SplashScreenComponent } from '@/shared/components';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const navState = useRootNavigationState();
  const [bootFinished, setBootFinished] = useState(false);

  // Show branding splash screen while navigation is bootstrapping or
  // authentication is still resolving for unauthenticated users.
  if (!navState?.key || (isLoading && !isAuthenticated)) {
    return <SplashScreenComponent />;
  }

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/login' as never} />;
  }

  // Immersive gaming boot sequence when starting the app or after successful auth
  if (!bootFinished) {
    return <LoadingScreen variant="boot" onBootComplete={() => setBootFinished(true)} />;
  }

  // Prevent flashing the buyer dashboard before onboarding is complete
  if (user && !user.onboardingCompleted) {
    return <Redirect href={'/(auth)/onboarding/role-select' as never} />;
  }

  const role = user?.role ?? 'buyer';

  if (role === 'seller') {
    const status = user?.sellerApprovalStatus || 'none';
    if (status === 'none' || status === 'rejected') {
      return <Redirect href={'/(auth)/seller-approval' as never} />;
    }
  }

  if (role === 'admin') return <Redirect href={'/(admin)/dashboard' as never} />;
  if (role === 'seller') return <Redirect href={'/(seller)/dashboard' as never} />;
  if (role === 'supplier') return <Redirect href={'/(supplier)/dashboard' as never} />;
  return <Redirect href={'/(buyer)/dashboard' as never} />;
}
