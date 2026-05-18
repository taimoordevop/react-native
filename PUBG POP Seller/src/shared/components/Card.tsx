import type { ReactNode } from 'react';
import { View } from 'react-native';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`bg-surface-100 rounded-2xl p-4 ${className}`}>
      {children}
    </View>
  );
}
