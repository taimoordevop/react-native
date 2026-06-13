import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

export function LogoBadge() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Outer rotating ring */}
      <Animated.View style={[styles.outerRing, { transform: [{ rotate: rotation }] }]}>
        {/* Four dot markers on the ring at N/E/S/W */}
        {/* North Dot */}
        <View style={[styles.dot, { top: -4, left: '50%', marginLeft: -3, width: 6, height: 6, borderRadius: 3, opacity: 0.8 }]} />
        {/* East Dot */}
        <View style={[styles.dot, { right: -3, top: '50%', marginTop: -2, width: 4, height: 4, borderRadius: 2, opacity: 0.4 }]} />
        {/* South Dot */}
        <View style={[styles.dot, { bottom: -3.5, left: '50%', marginLeft: -2.5, width: 5, height: 5, borderRadius: 2.5, opacity: 0.6 }]} />
        {/* West Dot */}
        <View style={[styles.dot, { left: -3, top: '50%', marginTop: -2, width: 4, height: 4, borderRadius: 2, opacity: 0.3 }]} />
      </Animated.View>

      {/* Inner static circle */}
      <View style={styles.innerCircle}>
        {/* Helmet Emblem (60x60dp) */}
        <View style={styles.helmetContainer}>
          {/* Dome */}
          <View style={styles.helmetDome} />
          {/* Visor */}
          <View style={styles.helmetVisor}>
            <Text style={styles.visorText}>POP</Text>
          </View>
          {/* Jaw */}
          <View style={styles.helmetJaw} />
          {/* Green checkmark SVG */}
          <View style={styles.checkmarkContainer}>
            <Svg width="16" height="16" viewBox="0 0 20 20">
              <Polyline
                points="2,9 7,14 16,4"
                fill="none"
                stroke="#4DB366"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(212, 160, 23, 0.5)',
  },
  dot: {
    position: 'absolute',
    backgroundColor: '#D4A017',
  },
  innerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0D1017',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 160, 23, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  helmetContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  helmetDome: {
    width: 44,
    height: 32,
    backgroundColor: '#2a2d35',
    borderWidth: 1.5,
    borderColor: '#404550',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    position: 'absolute',
    top: 6,
  },
  helmetVisor: {
    width: 38,
    height: 14,
    backgroundColor: '#1a2030',
    borderWidth: 1,
    borderColor: '#253040',
    borderRadius: 4,
    position: 'absolute',
    top: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  visorText: {
    fontSize: 8,
    fontFamily: 'Rajdhani_700Bold',
    fontWeight: '700',
    color: '#4DB366',
    letterSpacing: 1,
  },
  helmetJaw: {
    width: 44,
    height: 10,
    backgroundColor: '#22252D',
    borderWidth: 1.5,
    borderColor: '#404550',
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    position: 'absolute',
    top: 38,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 0,
    right: -2,
    zIndex: 5,
  },
});
