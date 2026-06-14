import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

const carouselData = [
  {
    id: 1,
    title: 'Track Your Finances',
    subtitle: 'Keep track of your income and expenses with ease',
    icon: 'wallet-outline',
  },
  {
    id: 2,
    title: 'Set Smart Goals',
    subtitle: 'Create and achieve your financial goals',
    icon: 'flag-outline',
  },
  {
    id: 3,
    title: 'Smart Analytics',
    subtitle: 'Get insights into your spending patterns',
    icon: 'analytics-outline',
  },
];

interface SplashScreenProps {
  onFinish: () => void;
  onBiometricSuccess?: (userId: string, userEmail: string | null, userName: string | null) => void;
}

export default function SplashScreen({ onFinish, onBiometricSuccess }: SplashScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showBiometric, setShowBiometric] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    const timer = setTimeout(() => {
      onFinish();
    }, 6000); // Show splash for 6 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  const checkBiometricAvailability = async () => {
    try {
      const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');
      const savedUserId = await SecureStore.getItemAsync('userId');
      if (biometricEnabled === 'true' && savedUserId) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setShowBiometric(hasHardware && enrolled);
      }
    } catch (error) {
      console.error('Error checking biometric:', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with fingerprint',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        const savedUserId = await SecureStore.getItemAsync('userId');
        const savedEmail = await SecureStore.getItemAsync('userEmail');
        const savedName = await SecureStore.getItemAsync('userName');
        if (savedUserId && onBiometricSuccess) {
          onBiometricSuccess(savedUserId, savedEmail, savedName);
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndex < carouselData.length - 1) {
        setCurrentIndex(currentIndex + 1);
        scrollViewRef.current?.scrollTo({
          x: (currentIndex + 1) * width,
          animated: true,
        });
      } else {
        setCurrentIndex(0);
        scrollViewRef.current?.scrollTo({
          x: 0,
          animated: true,
        });
      }
    }, 2000); // Change slide every 2 seconds

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentIndex(index);
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {carouselData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#4f8cff', '#6a82fb', '#a18cd1']}
      style={styles.container}
    >
      {/* App Name Only - No Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.appName}>Budget Tracker</Text>
        <Text style={styles.appTagline}>Smart Financial Management</Text>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {carouselData.map((item, index) => (
            <View key={item.id} style={styles.slide}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={80} color="#fff" />
              </View>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          ))}
        </ScrollView>
        {renderDots()}
      </View>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={onFinish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Fingerprint Button - Only show if biometric is enabled */}
      {showBiometric && (
        <TouchableOpacity style={styles.fingerprintButton} onPress={handleBiometricAuth}>
          <View style={styles.fingerprintCircle}>
            <MaterialCommunityIcons name="fingerprint" size={40} color="#fff" />
          </View>
          <Text style={styles.fingerprintText}>Quick Login</Text>
        </TouchableOpacity>
      )}

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDots}>
          <Animated.View style={[styles.loadingDot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.loadingDot, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.loadingDot, { opacity: fadeAnim }]} />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  carouselContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  slideSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 24,
  },
  skipButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  fingerprintButton: {
    position: 'absolute',
    bottom: 140,
    alignItems: 'center',
  },
  fingerprintCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  fingerprintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});