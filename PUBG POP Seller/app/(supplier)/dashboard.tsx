import { router } from 'expo-router';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useSupplierBookings, useOpenSupplierRequests } from '@/features/requests/hooks/useRequests';

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

export default function SupplierDashboard() {
  const { user } = useAuthStore();
  const { bookings } = useSupplierBookings(user?.uid);
  const { requests: openRequests } = useOpenSupplierRequests();

  const pendingBookings   = bookings.filter((b) => b.status === 'pending');
  const acceptedBookings  = bookings.filter((b) => b.status === 'accepted');
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  const totalEarnings = completedBookings.reduce(
    (sum, b) => sum + b.bookedAmount,
    0,
  );

  return (
    <SafeAreaView className="flex-1 bg-[#090d16]">
      {/* Header */}
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: 'rgba(212, 160, 23, 0.2)' }} className="flex-row items-center px-4 py-3 bg-[#090d16]">
        <View className="flex-1">
          <Text style={{ letterSpacing: 1 }} className="text-surface-400 text-xxs uppercase">OPERATOR ACTIVE</Text>
          <Text className="text-white text-base font-bold">{user?.displayName ?? 'Supplier'}</Text>
        </View>
        <View style={{ borderWidth: 1, borderColor: '#D4A017', backgroundColor: 'rgba(212, 160, 23, 0.15)', borderRadius: 4 }} className="px-3 py-1">
          <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-xs font-bold uppercase">Supplier</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Background Overlay */}
        <TacticalGrid />
        <CornerReticles />

        {/* Stats */}
        <View className="flex-row gap-3 mb-5">
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.3)', borderRadius: 4 }} className="flex-grow flex-1 p-4">
            <Text className="text-[#D4A017] text-3xl font-bold">{pendingBookings.length}</Text>
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs uppercase mt-1">Pending</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', borderRadius: 4 }} className="flex-grow flex-1 p-4">
            <Text className="text-blue-400 text-3xl font-bold">{acceptedBookings.length}</Text>
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs uppercase mt-1">To Send</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: 4 }} className="flex-grow flex-1 p-4">
            <Text className="text-green-400 text-3xl font-bold">
              {totalEarnings >= 1000 ? `${(totalEarnings / 1000).toFixed(0)}k` : String(totalEarnings)}
            </Text>
            <Text style={{ letterSpacing: 1 }} className="text-surface-300 text-xxs uppercase mt-1">POP Sent</Text>
          </View>
        </View>

        {/* Available requests teaser */}
        {openRequests.length > 0 && (
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              borderWidth: 1.5,
              borderColor: 'rgba(34, 197, 94, 0.3)',
              borderRadius: 4,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(supplier)/requests' as never)}
          >
            <View className="flex-1">
              <Text style={{ letterSpacing: 1.5 }} className="text-green-400 text-xs font-bold uppercase mb-1">📡 BROADCAST DETECTED</Text>
              <Text className="text-white text-lg font-bold">
                {openRequests.length} Open Request{openRequests.length !== 1 ? 's' : ''} Available
              </Text>
              <Text className="text-surface-400 text-xs mt-0.5">
                Tap to browse and book POP amounts you can supply
              </Text>
            </View>
            <Text className="text-green-400 text-xl font-bold">›</Text>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4 mb-4">
          <Text style={{ letterSpacing: 1.5 }} className="text-white font-bold text-xs uppercase mb-3">TACTICAL OPERATIONS</Text>

          <TouchableOpacity
            style={{
              borderWidth: 1.5,
              borderColor: '#D4A017',
              borderRadius: 2,
              backgroundColor: 'rgba(212, 160, 23, 0.15)',
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(supplier)/requests' as never)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1.5 }} className="flex-1 uppercase">＋ Browse Seller Requests</Text>
            <Text className="text-[#D4A017]">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: 4,
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.push('/(supplier)/my-bookings' as never)}
          >
            <Text style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }} className="flex-1 uppercase">My Bookings</Text>
            {acceptedBookings.length > 0 && (
              <View style={{ backgroundColor: '#D4A017' }} className="rounded-full w-5 h-5 items-center justify-center mr-2">
                <Text className="text-black text-xxs font-bold">{acceptedBookings.length}</Text>
              </View>
            )}
            <Text className="text-surface-400">›</Text>
          </TouchableOpacity>
        </View>

        {/* Recent bookings */}
        <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ letterSpacing: 1 }} className="text-white font-bold text-xs uppercase">Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/(supplier)/my-bookings' as never)}>
              <Text style={{ letterSpacing: 1 }} className="text-[#D4A017] text-xxs font-bold uppercase">View All</Text>
            </TouchableOpacity>
          </View>

          {bookings.slice(0, 3).length === 0 ? (
            <Text className="text-surface-300 text-xs text-center py-6 leading-relaxed">
              No bookings yet. Browse open requests to get started.
            </Text>
          ) : (
            bookings.slice(0, 3).map((b, index, arr) => (
              <View
                key={b.id}
                style={{ borderBottomWidth: index === arr.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                className="flex-row justify-between items-center py-3"
              >
                <View>
                  <Text className="text-white text-sm font-bold">
                    {b.bookedAmount.toLocaleString()} POP
                  </Text>
                  <Text className="text-surface-300 text-xxs mt-0.5">
                    Req: {b.requestId.slice(0, 8)}…
                  </Text>
                </View>
                <View style={{
                  borderWidth: 1,
                  borderColor: b.status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : b.status === 'accepted' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(212, 160, 23, 0.2)',
                  backgroundColor: b.status === 'completed' ? 'rgba(34, 197, 94, 0.08)' : b.status === 'accepted' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(212, 160, 23, 0.08)',
                  borderRadius: 2,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}>
                  <Text
                    style={{
                      color: b.status === 'completed' ? '#22c55e' : b.status === 'accepted' ? '#3b82f6' : '#D4A017',
                      fontSize: 9,
                      fontWeight: 'bold',
                      letterSpacing: 0.5,
                    }}
                    className="uppercase"
                  >
                    {b.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
