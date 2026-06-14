import { Stack } from 'expo-router';
import React, { useState, createContext, useEffect, useRef } from 'react';
import { ActivityIndicator, View, Alert, TouchableOpacity, Text, Platform } from 'react-native';
import LoginScreen from './LoginScreen';
import SplashScreen from './splash';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { BudgetContextProvider } from './(tabs)/budget';
import SettingsScreen from './settings/SettingsScreen';
import { supabase } from './supabase';
import * as Notifications from 'expo-notifications';
import NotificationService from './services/NotificationService';
import FutureNotificationService from './services/FutureNotificationService';

// Configure foreground notification display at module level
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Platform-safe storage utility
const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.log('Error getting item from SecureStore:', error);
      return null;
    }
  },
  
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.log('Error setting item in SecureStore:', error);
    }
  }
};

// Create a context for login state
export const AuthContext = createContext({
  isLoggedIn: false,
  setIsLoggedIn: (_: boolean) => {},
  userId: undefined as string | undefined,
  setUserId: (_: string | undefined) => {},
  userName: undefined as string | undefined,
  setUserName: (_: string | undefined) => {},
  userEmail: undefined as string | undefined,
  setUserEmail: (_: string | undefined) => {},
});

// Create a context for currency state
export const CurrencyContext = createContext({
  currency: 'USD',
  setCurrency: (_: 'PKR' | 'USD' | 'GBP') => {},
  getCurrencySymbol: (_: string) => '$' as string,
  currencyLoaded: false,
});

export const SettingsModalContext = createContext({ openSettings: () => {} });

export function CurrencyContextProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<'PKR' | 'USD' | 'GBP'>('USD');
  const [currencyLoaded, setCurrencyLoaded] = useState(false);

  const getCurrencySymbol = (cur: string) => {
    switch (cur) {
      case 'PKR': return 'Rs';
      case 'GBP': return '£';
      case 'USD':
      default: return '$';
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const storedCurrency = await safeStorage.getItem('currency');
        if (storedCurrency === 'PKR' || storedCurrency === 'USD' || storedCurrency === 'GBP') {
          setCurrency(storedCurrency);
        }
      } catch (e) {
        console.log('Error loading currency from storage', e);
      }
      setCurrencyLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (currencyLoaded) {
      safeStorage.setItem('currency', currency).catch(e => console.log('Error saving currency', e));
    }
  }, [currency, currencyLoaded]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, getCurrencySymbol, currencyLoaded }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export default function RootLayout() {
  // Local login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isBiometricChecked, setIsBiometricChecked] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const openSettings = () => setSettingsModalVisible(true);
  const closeSettings = () => setSettingsModalVisible(false);

  useEffect(() => {
    (async () => {
      const savedIsLoggedIn = await safeStorage.getItem('isLoggedIn');
      const savedUserId = await safeStorage.getItem('userId');
      const savedUserEmail = await safeStorage.getItem('userEmail');
      const savedUserName = await safeStorage.getItem('userName');
      const biometricEnabled = await safeStorage.getItem('biometricEnabled');
      
      if (savedIsLoggedIn === 'true' && savedUserId) {
        // User has "Remember Me" enabled, check if they want biometric
        if (biometricEnabled === 'true') {
          // User has enabled fingerprint, prompt for biometric
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          if (hasHardware && enrolled) {
            const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Login with fingerprint' });
            if (result.success) {
              // Biometric successful, log user in
              const { data: existingUser } = await supabase
                .from('users')
                .select('name')
                .eq('id', savedUserId)
                .single();
              
              setUserId(savedUserId);
              setUserEmail(savedUserEmail || undefined);
              setUserName(existingUser?.name || savedUserName || undefined);
              setIsLoggedIn(true);
            } else {
              // Biometric failed, user needs to login manually
              Alert.alert('Authentication failed', 'Please login manually.');
              setIsLoggedIn(false);
              setUserId(undefined);
              setUserEmail(undefined);
              setUserName(undefined);
            }
          } else {
            // No biometric hardware or not enrolled, but user has "Remember Me"
            // Log them in directly without biometric
            const { data: existingUser } = await supabase
              .from('users')
              .select('name')
              .eq('id', savedUserId)
              .single();
            
            setUserId(savedUserId);
            setUserEmail(savedUserEmail || undefined);
            setUserName(existingUser?.name || savedUserName || undefined);
            setIsLoggedIn(true);
          }
        } else {
          // User has "Remember Me" but no biometric, log them in directly
          const { data: existingUser } = await supabase
            .from('users')
            .select('name')
            .eq('id', savedUserId)
            .single();
          
          setUserId(savedUserId);
          setUserEmail(savedUserEmail || undefined);
          setUserName(existingUser?.name || savedUserName || undefined);
          setIsLoggedIn(true);
        }
      } else {
        // No "Remember Me" or no saved login data, show login screen
        setIsLoggedIn(false);
        setUserId(undefined);
        setUserEmail(undefined);
        setUserName(undefined);
      }
      setIsBiometricChecked(true);
    })();
  }, []);

  // ─── Notification listeners (registered once at root level) ────────────────
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Register notification received listener (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received (foreground):', notification.request.content.title);
    });

    // Register notification response listener (user tapped notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      console.log('🔔 Notification tapped:', data?.type);
      NotificationService.handleNotificationResponse(response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Initialize smart reminders when user logs in
  useEffect(() => {
    if (isLoggedIn && userId) {
      (async () => {
        try {
          await NotificationService.initialize();
          await NotificationService.initializeSmartReminders(userId);
          await FutureNotificationService.getInstance().initializeFutureNotifications(userId);
          console.log('✅ All notification services initialized for user:', userId);
        } catch (error) {
          console.error('❌ Error initializing notifications on login:', error);
        }
      })();
    }
  }, [isLoggedIn, userId]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleBiometricSuccess = async (savedUserId: string, savedEmail: string | null, savedName: string | null) => {
    // Fetch user data from database
    const { data: existingUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', savedUserId)
      .single();
    
    setUserId(savedUserId);
    setUserEmail(savedEmail || undefined);
    setUserName(existingUser?.name || savedName || undefined);
    setIsLoggedIn(true);
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} onBiometricSuccess={handleBiometricSuccess} />;
  }

  if (!isBiometricChecked) {
    // Show a loading indicator while checking biometrics
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userId, setUserId, userName, setUserName, userEmail, setUserEmail }}>
      {!isLoggedIn ? (
        <LoginScreen />
      ) : (
        <CurrencyContextProvider>
          <BudgetContextProvider>
            <SettingsModalContext.Provider value={{ openSettings }}>
              <Stack screenOptions={{ headerShown: false }} />
              {settingsModalVisible && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                  <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={closeSettings} />
                  <View style={{ width: '90%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16 }}>
                    <TouchableOpacity style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }} onPress={closeSettings}>
                      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#636e72' }}>×</Text>
                    </TouchableOpacity>
                    <SettingsScreen />
                  </View>
                </View>
              )}
            </SettingsModalContext.Provider>
          </BudgetContextProvider>
        </CurrencyContextProvider>
      )}
    </AuthContext.Provider>
  );
}
