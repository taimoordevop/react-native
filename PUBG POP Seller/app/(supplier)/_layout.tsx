import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function SupplierLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Redirect href={'/(auth)/login' as never} />;
  if (user?.role && user.role !== 'supplier') return <Redirect href={'/' as never} />;

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
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'list-outline' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'receipt-outline' as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="listings" options={{ href: null }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
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
