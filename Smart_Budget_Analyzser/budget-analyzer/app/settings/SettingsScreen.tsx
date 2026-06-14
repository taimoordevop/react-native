import React, { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Switch, Alert } from 'react-native';
import { CurrencyContext } from '../_layout';
import { AuthContext } from '../_layout';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const currencyFlags = {
  PKR: 'https://flagcdn.com/pk.png',
  USD: 'https://flagcdn.com/us.png',
  GBP: 'https://flagcdn.com/gb.png',
};

export default function SettingsScreen() {
  const { currency, setCurrency } = useContext(CurrencyContext);
  const { userId } = useContext(AuthContext);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const enabled = await SecureStore.getItemAsync('biometricEnabled');
      setBiometricEnabled(enabled === 'true');
    })();
  }, []);

  const handleToggleBiometric = async () => {
    if (!biometricEnabled) {
      await SecureStore.setItemAsync('biometricEnabled', 'true');
      if (userId) await SecureStore.setItemAsync('userId', userId);
      setBiometricEnabled(true);
    } else {
      await SecureStore.deleteItemAsync('biometricEnabled');
      await SecureStore.deleteItemAsync('userId');
      setBiometricEnabled(false);
    }
  };

  const handleCurrencyChange = async (cur: 'PKR' | 'USD' | 'GBP') => {
    setCurrency(cur);
    await SecureStore.setItemAsync('currency', cur);
  };

  return (
    <View style={styles.screen}>
      {/* Back Arrow Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#636e72" />
      </TouchableOpacity>
      <Text style={styles.header}>Settings</Text>
      {/* Security Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.rowBetween}>
        <Text style={styles.settingLabel}>Enable Fingerprint Login</Text>
          <Switch
            value={biometricEnabled}
            onValueChange={handleToggleBiometric}
            trackColor={{ false: '#dfe6e9', true: '#00b894' }}
            thumbColor={biometricEnabled ? '#fff' : '#636e72'}
          />
        </View>
      </View>
      {/* Divider */}
      <View style={styles.divider} />
      {/* Preferences Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.rowBetween}>
        <Text style={styles.settingLabel}>Currency</Text>
          <View style={styles.currencyRow}>
            {(['PKR', 'USD', 'GBP'] as const).map((cur) => (
            <TouchableOpacity
              key={cur}
                onPress={() => handleCurrencyChange(cur)}
                style={[styles.flagBtn, currency === cur && styles.flagBtnActive]}
            >
                <Image source={{ uri: currencyFlags[cur] }} style={styles.flag} />
                <Text style={[styles.flagText, currency === cur && styles.flagTextActive]}>{cur}</Text>
            </TouchableOpacity>
          ))}
          </View>
        </View>
        
        {/* Notification settings moved to Profile screen */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f6fa', padding: 0 },
  backButton: { position: 'absolute', top: 48, left: 18, zIndex: 10, backgroundColor: '#fff', borderRadius: 20, padding: 4, elevation: 2 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#2d3436', marginTop: 48, marginBottom: 24, alignSelf: 'center', letterSpacing: 1 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 24, marginHorizontal: 18, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#636e72', marginBottom: 16, letterSpacing: 0.5 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  settingLabel: { fontSize: 16, color: '#636e72', flex: 1 },
  divider: { height: 1, backgroundColor: '#dfe6e9', marginHorizontal: 24, marginBottom: 8 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', maxWidth: '100%' },
  flagBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: '#dfe6e9', marginLeft: 8, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  flagBtnActive: { backgroundColor: '#00b894', borderColor: '#00b894' },
  flag: { width: 28, height: 18, borderRadius: 3, marginRight: 6 },
  flagText: { color: '#636e72', fontWeight: 'bold', fontSize: 15 },
  flagTextActive: { color: '#fff' },
  settingInfo: { flex: 1, marginRight: 16 },
  settingDescription: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
  notificationButton: { padding: 8, backgroundColor: '#f8f9fa', borderRadius: 8 },
  testNotificationButton: { padding: 8, backgroundColor: '#e8f5e8', borderRadius: 8 },
}); 