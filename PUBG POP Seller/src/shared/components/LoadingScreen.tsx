import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fonts } from '@/constants/theme';
import { TacticalGrid } from './TacticalGrid';
import { ScanLine } from './ScanLine';
import { FieldIntelTip } from './FieldIntelTip';

interface LoadingScreenProps {
  variant?: 'boot' | 'market';
  onBootComplete?: () => void;
}

export function LoadingScreen({ variant = 'boot', onBootComplete }: LoadingScreenProps) {
  // Shared animations
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Boot Variant Animations
  const bootProgress = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);

  // Market Variant Animations
  const floatAnim1 = useRef(new Animated.Value(1)).current;
  const floatAnim2 = useRef(new Animated.Value(1)).current;
  const marketProgress = useRef(new Animated.Value(0.2)).current;
  
  // Shimmer Animations for 3 cards
  const shimmerAnim1 = useRef(new Animated.Value(0)).current;
  const shimmerAnim2 = useRef(new Animated.Value(0)).current;
  const shimmerAnim3 = useRef(new Animated.Value(0)).current;

  // Spinners
  const spinOuter = useRef(new Animated.Value(0)).current;
  const spinInner = useRef(new Animated.Value(0)).current;

  // Loop blink for Boot and General
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [blinkAnim]);

  // Run variant specific animations
  useEffect(() => {
    if (variant === 'boot') {
      // Set up percentage listener
      const listenerId = bootProgress.addListener(({ value }) => {
        setPercent(Math.floor(value * 100));
      });

      // Animate progress 0 -> 1 over 3.5s
      Animated.timing(bootProgress, {
        toValue: 1,
        duration: 3500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false, // width/layout animations cannot use native driver
      }).start(() => {
        if (onBootComplete) {
          onBootComplete();
        }
      });

      return () => {
        bootProgress.removeListener(listenerId);
      };
    } else {
      // Market animations
      // Float particle 1
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim1, {
            toValue: 1.08,
            duration: 6000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim1, {
            toValue: 1,
            duration: 6000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Float particle 2 with delay
      Animated.loop(
        Animated.sequence([
          Animated.delay(3000),
          Animated.timing(floatAnim2, {
            toValue: 1.08,
            duration: 6000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim2, {
            toValue: 1,
            duration: 6000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Top Progress oscillating bar
      Animated.loop(
        Animated.sequence([
          Animated.timing(marketProgress, {
            toValue: 0.9,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(marketProgress, {
            toValue: 0.2,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Spinner loops
      Animated.loop(
        Animated.timing(spinOuter, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.timing(spinInner, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Shimmers for 3 cards
      const createShimmerLoop = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      };

      createShimmerLoop(shimmerAnim1, 0).start();
      createShimmerLoop(shimmerAnim2, 300).start();
      createShimmerLoop(shimmerAnim3, 600).start();

      return () => {};
    }
  }, [variant]);

  // Rotations for spinner
  const rotationOuter = spinOuter.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotationInner = spinInner.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  if (variant === 'boot') {
    const progressWidth = bootProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.bootContainer}>
        <TacticalGrid variant="crosshatch" />
        <ScanLine duration={3000} />

        {/* Diagonal Skewed Panels */}
        <View style={[styles.skewPanel, { left: -30, width: 120, backgroundColor: 'rgba(212, 160, 23, 0.03)' }]} pointerEvents="none" />
        <View style={[styles.skewPanel, { right: -30, width: 80, backgroundColor: 'rgba(212, 160, 23, 0.025)' }]} pointerEvents="none" />

        <View className="flex-1 justify-between px-6 py-12">
          {/* Mini Logo Bar */}
          <View className="flex-row items-center justify-center gap-2 mt-4">
            <Text style={styles.miniLogo}>PUBG·POP</Text>
            <View style={styles.miniSeparator} />
            <Text style={styles.initializing}>INITIALIZING</Text>
          </View>

          {/* Center Tip Box */}
          <View className="w-full">
            <FieldIntelTip />
          </View>

          {/* Bottom Boot Progress and Status */}
          <View className="w-full mb-4">
            {/* Progress Label */}
            <View className="flex-row justify-between items-center mb-2">
              <Text style={styles.bootLabel}>SYSTEM BOOT</Text>
              <Text style={styles.bootPercent}>{percent}%</Text>
            </View>
            {/* Progress Track */}
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            {/* Status Chips Row */}
            <View className="flex-row gap-2 mt-6">
              {/* Auth Chip (Done) */}
              <View style={[styles.statusChip, { borderColor: 'rgba(77, 179, 102, 0.15)' }]}>
                <Feather name="shield" size={14} color="#4DB366" />
                <Text style={[styles.statusText, { color: '#4DB366' }]}>AUTH</Text>
              </View>

              {/* Data Chip (Done) */}
              <View style={[styles.statusChip, { borderColor: 'rgba(77, 179, 102, 0.15)' }]}>
                <Feather name="database" size={14} color="#4DB366" />
                <Text style={[styles.statusText, { color: '#4DB366' }]}>DATA</Text>
              </View>

              {/* Market Chip (Active) */}
              <Animated.View style={[styles.statusChip, { borderColor: 'rgba(212, 160, 23, 0.25)', opacity: blinkAnim }]}>
                <Feather name="shopping-bag" size={14} color="#D4A017" />
                <Text style={[styles.statusText, { color: '#D4A017' }]}>MARKET</Text>
              </Animated.View>

              {/* Alerts Chip (Pending) */}
              <View style={[styles.statusChip, { borderColor: 'rgba(255,255,255,0.02)' }]}>
                <Feather name="bell" size={14} color="#3a3a4a" />
                <Text style={[styles.statusText, { color: '#3a3a4a' }]}>ALERTS</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Market Sync Variant
  const fillWidth = marketProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.marketContainer}>
      {/* Top Progress Bar */}
      <View style={styles.topProgressBarTrack}>
        <Animated.View style={[styles.topProgressBarFill, { width: fillWidth }]} />
      </View>

      {/* Floating Particle 1 */}
      <Animated.View
        style={[
          styles.particleCircle,
          {
            top: -80,
            left: -80,
            width: 200,
            height: 200,
            borderRadius: 100,
            transform: [{ scale: floatAnim1 }],
          },
        ]}
      />

      {/* Floating Particle 2 */}
      <Animated.View
        style={[
          styles.particleCircle,
          {
            bottom: -60,
            right: -60,
            width: 150,
            height: 150,
            borderRadius: 75,
            transform: [{ scale: floatAnim2 }],
          },
        ]}
      />

      <View className="flex-1 justify-center items-center px-6">
        {/* Dual Spinner ring */}
        <View style={styles.spinnerWrapper}>
          {/* Outer Ring */}
          <Animated.View style={[styles.outerSpinner, { transform: [{ rotate: rotationOuter }] }]} />
          {/* Inner Ring */}
          <Animated.View style={[styles.innerSpinner, { transform: [{ rotate: rotationInner }] }]} />
          {/* Center Label */}
          <Text style={styles.spinnerLabel}>POP</Text>
        </View>

        {/* Message block */}
        <View style={styles.messageBlock}>
          <Text style={styles.syncText}>SYNCING MARKET</Text>
          <Text style={styles.subSyncText}>Fetching live listings...</Text>
        </View>

        {/* Item Preview Cards */}
        <View className="flex-row gap-2.5 w-full mt-10">
          {/* Card 1 */}
          <Animated.View
            style={[
              styles.itemCard,
              {
                borderColor: shimmerAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(212,160,23,0.1)', 'rgba(212,160,23,0.22)'],
                }),
                backgroundColor: shimmerAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.04)'],
                }),
              },
            ]}
          >
            <Feather name="shield" size={20} color="#4a4a5a" style={{ marginBottom: 5 }} />
            <Text style={styles.cardLabel}>HELMET</Text>
            <Text style={styles.cardPrice}>$4.20</Text>
          </Animated.View>

          {/* Card 2 */}
          <Animated.View
            style={[
              styles.itemCard,
              {
                borderColor: shimmerAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(212,160,23,0.1)', 'rgba(212,160,23,0.22)'],
                }),
                backgroundColor: shimmerAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.04)'],
                }),
              },
            ]}
          >
            <Feather name="crosshair" size={20} color="#4a4a5a" style={{ marginBottom: 5 }} />
            <Text style={styles.cardLabel}>WEAPON</Text>
            <Text style={styles.cardPrice}>$12.50</Text>
          </Animated.View>

          {/* Card 3 */}
          <Animated.View
            style={[
              styles.itemCard,
              {
                borderColor: shimmerAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(212,160,23,0.1)', 'rgba(212,160,23,0.22)'],
                }),
                backgroundColor: shimmerAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.04)'],
                }),
              },
            ]}
          >
            <Feather name="tag" size={20} color="#4a4a5a" style={{ marginBottom: 5 }} />
            <Text style={styles.cardLabel}>OUTFIT</Text>
            <Text style={styles.cardPrice}>$8.90</Text>
          </Animated.View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          POWERED BY <Text style={styles.footerHighlight}>PUBG POP</Text> · SECURE TRADE
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    backgroundColor: '#060810',
    position: 'relative',
    overflow: 'hidden',
  },
  marketContainer: {
    flex: 1,
    backgroundColor: '#07080C',
    position: 'relative',
    overflow: 'hidden',
  },
  skewPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    transform: [{ skewX: '-12deg' }],
  },
  miniLogo: {
    fontFamily: fonts.orbitron900,
    fontSize: 13,
    color: '#D4A017',
    letterSpacing: 2,
    fontWeight: '900',
  },
  miniSeparator: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(212, 160, 23, 0.3)',
  },
  initializing: {
    fontFamily: fonts.rajdhani600,
    fontSize: 10,
    color: '#5a5a6a',
    letterSpacing: 3,
    fontWeight: '600',
  },
  bootLabel: {
    fontFamily: fonts.rajdhani600,
    fontSize: 10,
    color: '#5a5a6a',
    letterSpacing: 2,
    fontWeight: '600',
  },
  bootPercent: {
    fontFamily: fonts.orbitron700,
    fontSize: 12,
    color: '#D4A017',
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4A017',
    borderRadius: 2,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  statusText: {
    fontSize: 9,
    fontFamily: fonts.rajdhani600,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  topProgressBarTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
  },
  topProgressBarFill: {
    height: '100%',
    backgroundColor: '#D4A017',
  },
  particleCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(212, 160, 23, 0.04)',
  },
  spinnerWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerSpinner: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    borderColor: 'transparent',
    borderTopColor: '#D4A017',
    borderRightColor: 'rgba(212, 160, 23, 0.3)',
  },
  innerSpinner: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'transparent',
    borderBottomColor: '#A67C00',
    borderLeftColor: 'rgba(166, 124, 0, 0.3)',
  },
  spinnerLabel: {
    fontFamily: fonts.orbitron900,
    fontSize: 11,
    color: '#D4A017',
    letterSpacing: 1,
    fontWeight: '900',
  },
  messageBlock: {
    alignItems: 'center',
    marginTop: 24,
  },
  syncText: {
    fontFamily: fonts.rajdhani600,
    fontSize: 16,
    color: '#C8C0B0',
    letterSpacing: 2,
    fontWeight: '600',
  },
  subSyncText: {
    fontFamily: fonts.dmSans400,
    fontSize: 11,
    color: '#4a4a5a',
    marginTop: 4,
  },
  itemCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: fonts.rajdhani600,
    fontSize: 9,
    color: '#5a5a6a',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 3,
  },
  cardPrice: {
    fontFamily: fonts.orbitron700,
    fontSize: 10,
    color: '#D4A017',
    fontWeight: '700',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fonts.rajdhani400,
    fontSize: 9,
    color: '#2a2a3a',
    letterSpacing: 3,
  },
  footerHighlight: {
    color: '#D4A017',
    opacity: 0.5,
  },
});
