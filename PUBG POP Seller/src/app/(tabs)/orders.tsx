import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TABS = ['All', 'Pending', 'Active', 'Completed'] as const;
type Tab = (typeof TABS)[number];

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('All');

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold mb-4">Orders</Text>
        <View className="flex-row gap-2 mb-4">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 ${
                activeTab === tab ? 'bg-primary-500' : 'bg-surface-100'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  activeTab === tab ? 'text-white' : 'text-surface-300'
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View className="flex-1 items-center justify-center">
        <Text className="text-surface-300 text-sm">No orders yet</Text>
      </View>
    </SafeAreaView>
  );
}
