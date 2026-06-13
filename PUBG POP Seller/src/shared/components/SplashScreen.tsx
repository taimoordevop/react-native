import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing, Dimensions } from 'react-native';
import { fonts } from '@/constants/theme';
import { TacticalGrid } from './TacticalGrid';
import { LogoBadge } from './LogoBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ConcentricRing({ size, delay }: { size: number; delay: number }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, delay]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.04, 1],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale }],
          opacity,
          borderColor:
            size === 320
              ? 'rgba(212, 160, 23, 0.06)'
              : size === 240
              ? 'rgba(212, 160, 23, 0.10)'
              : 'rgba(212, 160, 23, 0.15)',
        },
      ]}
    />
  );
}

function LoadingDot({ delay, highlight }: { delay: number; highlight?: boolean }) {
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [dotAnim, delay]);

  const scale = dotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.5, 1],
  });

  const opacity = dotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [{ scale }],
          opacity,
          backgroundColor: highlight ? 'rgba(212, 160, 23, 0.6)' : 'rgba(212, 160, 23, 0.25)',
        },
      ]}
    />
  );
}

export function SplashScreenComponent() {
  return (
    <View style={styles.container}>
      {/* Background Grid */}
      <TacticalGrid variant="hex" />

      {/* Amber radial glow */}
      <View style={styles.glow} />

      {/* Concentric Rings Stack */}
      <View style={styles.ringsContainer} pointerEvents="none">
        <ConcentricRing size={320} delay={0} />
        <ConcentricRing size={240} delay={400} />
        <ConcentricRing size={160} delay={800} />
      </View>

      {/* Logo and Typography */}
      <View style={styles.content}>
        <LogoBadge />

        <View style={styles.typography}>
          <Text style={styles.pubg}>PUBG</Text>
          <Text style={styles.pop}>POP</Text>
          <Text style={styles.seller}>SELLER</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.tagline}>TRADE · VERIFY · DELIVER</Text>
      </View>

      {/* Bottom Loading Dots */}
      <View style={styles.dotsRow}>
        <LoadingDot delay={0} />
        <LoadingDot delay={300} highlight />
        <LoadingDot delay={600} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080A0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: 0,
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_WIDTH * 1.5,
    borderRadius: SCREEN_WIDTH * 0.75,
    backgroundColor: 'rgba(26, 18, 0, 0.15)',
    transform: [{ scaleY: 0.5 }],
  },
  ringsContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  typography: {
    alignItems: 'center',
    marginTop: 24,
  },
  pubg: {
    fontFamily: fonts.orbitron900,
    fontSize: 26,
    color: '#F2EDE4',
    letterSpacing: 4,
    fontWeight: '900',
  },
  pop: {
    fontFamily: fonts.orbitron700,
    fontSize: 18,
    color: '#D4A017',
    letterSpacing: 6,
    fontWeight: '700',
    marginTop: 2,
  },
  seller: {
    fontFamily: fonts.rajdhani600,
    fontSize: 11,
    color: '#5a5a6a',
    letterSpacing: 6,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: '#D4A017',
    opacity: 0.6,
    marginVertical: 14,
  },
  tagline: {
    fontFamily: fonts.rajdhani600,
    fontSize: 10,
    color: '#5a5a6a',
    letterSpacing: 3,
    fontWeight: '600',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
