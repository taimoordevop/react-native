import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function BuyerLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Redirect href={'/(auth)/login' as never} />;
  if (user?.role && user.role !== 'buyer') return <Redirect href={'/' as never} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#090d16',
          borderTopColor: 'rgba(212, 160, 23, 0.3)',
          borderTopWidth: 1.5,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#D4A017',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'home-outline' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'storefront-outline' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'receipt-outline' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'person-outline' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
