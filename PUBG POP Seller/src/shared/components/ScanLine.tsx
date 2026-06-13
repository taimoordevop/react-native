import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ScanLineProps {
  duration?: number;
  color?: string;
  height?: number;
}

export function ScanLine({
  duration = 3000,
  color = 'rgba(212, 160, 23, 0.4)',
  height = 1.5,
}: ScanLineProps) {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [duration, scanAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height,
        backgroundColor: color,
        transform: [{ translateY }],
        shadowColor: '#D4A017',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
      }}
      pointerEvents="none"
    />
  );
}
