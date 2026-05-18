import { Tabs } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#475569',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Market',
          tabBarLabel: 'Market',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
      {/* Hidden screen — accessible via router.push but no tab bar icon */}
      <Tabs.Screen
        name="create-listing"
        options={{ href: null }}
      />
    </Tabs>
  );
}
