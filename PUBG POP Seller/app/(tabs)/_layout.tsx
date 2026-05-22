import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

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
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'home' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Market',
          tabBarLabel: 'Market',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'storefront-outline' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'receipt-outline' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'person-outline' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      {/* Hidden — accessible via router.push but no tab icon */}
      <Tabs.Screen
        name="create-listing"
        options={{ href: null }}
      />
    </Tabs>
  );
}
