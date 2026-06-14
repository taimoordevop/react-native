import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTION } from '@/constants';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authService } from '@/features/auth/services/authService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.72;

const ADMIN_MENU = [
  { label: 'Dashboard', icon: '⊞', href: '/(admin)/dashboard' },
  { label: 'Manage Users', icon: '👥', href: '/(admin)/users' },
  { label: 'All Orders', icon: '📋', href: '/(admin)/all-orders' },
  { label: 'Seller Approvals', icon: '🛡️', href: '/(admin)/seller-approvals' },
  { label: 'Disputes', icon: '⚠️', href: '/(admin)/disputes' },
  { label: 'Profile', icon: '👤', href: '/(admin)/profile' },
];

function TacticalGrid() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 }} pointerEvents="none">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[...Array(12)].map((_, i) => (
          <View key={i} style={{ width: 1, height: '100%', backgroundColor: '#D4A017' }} />
        ))}
      </View>
      <View style={{ justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[...Array(20)].map((_, i) => (
          <View key={i} style={{ height: 1, width: '100%', backgroundColor: '#D4A017' }} />
        ))}
      </View>
    </View>
  );
}

function CornerReticles() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <View style={{ position: 'absolute', top: 16, left: 16, width: 16, height: 16, borderLeftWidth: 2, borderTopWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', top: 16, right: 16, width: 16, height: 16, borderRightWidth: 2, borderTopWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 16, left: 16, width: 16, height: 16, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
      <View style={{ position: 'absolute', bottom: 16, right: 16, width: 16, height: 16, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#D4A017', opacity: 0.5 }} />
    </View>
  );
}

function AdminDrawer({
  visible,
  onClose,
  currentPath,
}: {
  visible: boolean;
  onClose: () => void;
  currentPath: string;
}) {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await authService.signOut();
    signOut();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Slide-in panel */}
        <View
          style={{
            width: DRAWER_WIDTH,
            backgroundColor: '#090d16',
            height: '100%',
            paddingTop: 56,
            paddingHorizontal: 0,
            borderRightWidth: 1.5,
            borderRightColor: '#D4A017',
          }}
        >
          {/* User info */}
          <View className="px-5 pb-5 border-b border-white/5 mb-2">
            <View style={{ backgroundColor: 'rgba(212,160,23,0.12)', borderWidth: 1, borderColor: '#D4A017', borderRadius: 2 }} className="w-12 h-12 items-center justify-center mb-2">
              <Text className="text-[#D4A017] text-xl font-bold">
                {user?.displayName?.charAt(0)?.toUpperCase() ?? 'A'}
              </Text>
            </View>
            <Text className="text-white font-bold text-base">{user?.displayName}</Text>
            <Text className="text-surface-300 text-xs">{user?.email}</Text>
            <View style={{ backgroundColor: 'rgba(212,160,23,0.12)', borderRadius: 2 }} className="self-start mt-2 px-2 py-0.5">
              <Text className="text-[#D4A017] text-[10px] font-bold uppercase">Admin</Text>
            </View>
          </View>

          {/* Menu items */}
          {ADMIN_MENU.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => {
                  onClose();
                  router.push(item.href as never);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  backgroundColor: isActive ? 'rgba(212, 160, 23, 0.12)' : 'transparent',
                  borderLeftWidth: isActive ? 3 : 0,
                  borderLeftColor: '#D4A017',
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 12 }}>{item.icon}</Text>
                <Text
                  style={{
                    color: isActive ? '#D4A017' : '#cbd5e1',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: 13,
                    letterSpacing: 0.5,
                  }}
                  className="uppercase"
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Sign out */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              marginTop: 'auto',
              marginHorizontal: 20,
              marginBottom: 32,
              padding: 14,
              backgroundColor: 'rgba(239,68,68,0.1)',
              borderRadius: 2,
              borderWidth: 1.5,
              borderColor: 'rgba(239,68,68,0.2)',
              alignItems: 'center',
            }}
          >
            <Text className="text-red-400 text-xs font-bold uppercase">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Tap outside to close */}
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    revenueMTD: 0,
    openDisputes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qUsers = query(collection(db, COLLECTION.USERS));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setStats((prev) => ({ ...prev, totalUsers: snap.size }));
    }, (err) => console.error('[AdminDashboard] Users stats error:', err));

    const qOrders = query(collection(db, COLLECTION.ORDERS));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      let revenueMTD = 0;
      let openDisputes = 0;
      const now = new Date();

      snap.forEach((doc) => {
        const order = doc.data();
        if (order.status === 'disputed') {
          openDisputes++;
        }
        if (order.status === 'completed') {
          const completedAt = order.completedAt?.toDate?.() || 
                              (order.completedAt?.seconds ? new Date(order.completedAt.seconds * 1000) : null) ||
                              (order.completedAt instanceof Date ? order.completedAt : null);
          if (completedAt && completedAt.getMonth() === now.getMonth() && completedAt.getFullYear() === now.getFullYear()) {
            revenueMTD += order.commission || 0;
          }
        }
      });

      setStats((prev) => ({
        ...prev,
        totalOrders: snap.size,
        revenueMTD,
        openDisputes,
      }));
      setLoading(false);
    }, (err) => console.error('[AdminDashboard] Orders stats error:', err));

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#090d16] relative">
      <TacticalGrid />
      <CornerReticles />

      {/* Admin Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,0.1)', borderRadius: 2 }}
          className="mr-3 p-2.5"
        >
          <View className="gap-1">
            <View className="w-5 h-0.5 bg-[#D4A017] rounded" />
            <View className="w-5 h-0.5 bg-[#D4A017] rounded" />
            <View className="w-5 h-0.5 bg-[#D4A017] rounded" />
          </View>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold flex-1 uppercase">Admin Dashboard</Text>
        <View style={{ backgroundColor: 'rgba(212,160,23,0.12)', borderRadius: 2 }} className="px-3 py-1">
          <Text className="text-[#D4A017] text-[10px] font-bold uppercase">Admin</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Welcome */}
        <View className="mb-6 mt-2">
          <Text className="text-surface-300 text-xxs uppercase font-bold">Logged in as</Text>
          <Text className="text-white text-xl font-bold uppercase">{user?.displayName ?? 'Admin'}</Text>
        </View>

        {/* Stats grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          {[
            { label: 'Total Users', value: loading ? '—' : stats.totalUsers.toString(), color: 'text-blue-400', bg: 'rgba(59, 130, 246, 0.05) border-blue-500/15' },
            { label: 'Total Orders', value: loading ? '—' : stats.totalOrders.toString(), color: 'text-green-400', bg: 'rgba(34, 197, 94, 0.05) border-green-500/15' },
            { label: 'Revenue (MTD)', value: loading ? 'PKR —' : `PKR ${stats.revenueMTD.toLocaleString()}`, color: 'text-[#D4A017]', bg: 'rgba(212, 160, 23, 0.05) border-yellow-500/15' },
            { label: 'Open Disputes', value: loading ? '—' : stats.openDisputes.toString(), color: 'text-red-400', bg: 'rgba(239, 68, 68, 0.05) border-red-500/15' },
          ].map(({ label, value, color, bg }) => (
            <View
              key={label}
              className={`rounded border p-4 ${bg}`}
              style={{ width: (SCREEN_WIDTH - 44) / 2 }}
            >
              <Text className={`text-xl font-bold mb-1 ${color}`}>{value}</Text>
              <Text className="text-surface-300 text-[10px] uppercase font-bold">{label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.35)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="p-4 mb-4">
          <Text style={{ letterSpacing: 0.5 }} className="text-white text-xs font-bold uppercase mb-3">Quick Links</Text>
          {ADMIN_MENU.slice(1).map((item) => (
            <TouchableOpacity
              key={item.label}
              className="flex-row items-center py-3.5 border-b border-white/5"
              onPress={() => router.push(item.href as never)}
            >
              <Text className="text-xl mr-3">{item.icon}</Text>
              <Text className="text-white text-xs font-bold uppercase flex-1">{item.label}</Text>
              <Text className="text-[#D4A017] text-base">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info notice */}
        <View style={{ backgroundColor: 'rgba(212,160,23,0.05)', borderWidth: 1.5, borderColor: 'rgba(212, 160, 23, 0.25)', borderRadius: 4 }} className="p-4">
          <Text style={{ letterSpacing: 0.5 }} className="text-[#D4A017] font-bold text-xs uppercase mb-1.5">Admin Security Control</Text>
          <Text className="text-surface-300 text-[10px] uppercase font-medium leading-normal">
            Real-time platform statistics are connected. Use the menu (☰) or Quick Links above to manage users, orders, disputes, and view your profile.
          </Text>
        </View>
      </ScrollView>

      <AdminDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentPath="/(admin)/dashboard"
      />
    </SafeAreaView>
  );
}
