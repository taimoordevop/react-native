import { Stack } from 'expo-router';

/** Onboarding stack — shown after first auth before accessing the main app */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="role-select" />
      <Stack.Screen name="pubg-setup" />
    </Stack>
  );
}
