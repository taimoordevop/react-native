import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '../_layout';
import { CurrencyContext } from '../_layout';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../supabase';
import { decode } from 'base64-arraybuffer';

interface MenuItem {
  icon: string;
  title: string;
  value: string;
  action: (() => void) | null;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

export default function ProfileScreen() {
  const { userId, userName, userEmail, setIsLoggedIn, setUserId } = useContext(AuthContext);
  const { currency, setCurrency, getCurrencySymbol } = useContext(CurrencyContext);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const enabled = await SecureStore.getItemAsync('biometricEnabled');
      // Default to false - fingerprint login is off by default
      setBiometricEnabled(enabled === 'true');
      
      // Load profile image from Supabase users table
      await loadProfileImage();
    })();
  }, [userId]);

  const loadProfileImage = async () => {
    if (!userId) return;

    try {
      // Load profile image URL from Supabase users table
      const { data, error } = await supabase
        .from('users')
        .select('profile_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile URL from Supabase:', error);
        return;
      }

      if (data?.profile_url) {
        setProfileImage(data.profile_url);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const pickImage = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photo library.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Reduce quality to minimize file size
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      await uploadProfileImage(imageUri);
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    if (!userId) return;

    setUploading(true);
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Generate unique file name
      const fileExt = imageUri.split('.').pop();
      const fileName = `${userId}/profile.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true, // Replace existing file
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'Failed to upload image to storage.');
        return;
      }

      // Get public URL with cache-busting timestamp so the Image component re-fetches
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?cb=${Date.now()}`;

      // Update users table with profile_url
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile URL in database:', updateError);
        Alert.alert('Error', 'Failed to save profile URL.');
        return;
      }

      // Update local state
      setProfileImage(publicUrl);
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error saving profile image:', error);
      Alert.alert('Error', 'An error occurred while saving your profile picture.');
    } finally {
      setUploading(false);
    }
  };

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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clear login state from SecureStore
            await SecureStore.deleteItemAsync('isLoggedIn');
            // Clear biometric enabled flag (user must re-enable after login)
            await SecureStore.deleteItemAsync('biometricEnabled');
            // Update React state
            setIsLoggedIn(false);
            setUserId(undefined);
            setBiometricEnabled(false);
            // Navigate to login screen
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleCurrencyChange = (newCurrency: 'USD' | 'PKR' | 'GBP') => {
    setCurrency(newCurrency);
  };

  const handleEditName = () => {
    router.push('/edit_name');
  };

  const profileSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          title: 'Name',
          value: userName || 'Not set',
          action: handleEditName
        },
        {
          icon: 'mail-outline',
          title: 'Email',
          value: userEmail || 'Not available',
          action: null
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'cash-outline',
          title: 'Currency',
          value: `${currency} (${getCurrencySymbol(currency)})`,
          action: () => {
            Alert.alert(
              'Select Currency',
              'Choose your preferred currency',
              [
                { text: 'USD ($)', onPress: () => handleCurrencyChange('USD') },
                { text: 'PKR (₨)', onPress: () => handleCurrencyChange('PKR') },
                { text: 'GBP (£)', onPress: () => handleCurrencyChange('GBP') },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        },
        {
          icon: 'finger-print-outline',
          title: 'Fingerprint Login',
          value: biometricEnabled ? 'Enabled' : 'Disabled',
          action: null,
          isSwitch: true,
          switchValue: biometricEnabled,
          onSwitchChange: handleToggleBiometric
        },
        {
          icon: 'information-circle-outline',
          title: 'Fingerprint Info',
          value: 'Use fingerprint to login quickly',
          action: () => Alert.alert(
            'Fingerprint Login', 
            'When enabled, you can use your fingerprint to login instead of entering your password. This feature only works if you have "Remember Me" checked during login.'
          )
        },
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          value: 'Settings & Test',
          action: () => router.push('/notification_settings')
        },
        {
          icon: 'card-outline',
          title: 'Category Budget Limits',
          value: 'Set Limits',
          action: () => router.push('/category_budget_limits')
        }
      ]
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          icon: 'shield-outline',
          title: 'Privacy Policy',
          value: '',
          action: () => router.push('/privacy_policy')
        },
        {
          icon: 'document-text-outline',
          title: 'Terms of Service',
          value: '',
          action: () => router.push('/terms_of_service')
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help & Support',
          value: '',
          action: () => router.push('/help_support')
        },
        {
          icon: 'information-circle-outline',
          title: 'About',
          value: 'Version 1.0.0',
          action: () => router.push('/about')
        }
      ]
    }
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
      </View>

      {/* Profile Picture Section */}
      <View style={styles.profilePictureSection}>
        <TouchableOpacity style={styles.profilePictureContainer} onPress={pickImage} disabled={uploading}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons name="person-outline" size={50} color="#636e72" />
            </View>
          )}
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.changePictureTextContainer} onPress={pickImage} disabled={uploading}>
          <Text style={styles.changePictureText}>
            {uploading ? 'Uploading...' : profileImage ? 'Change Picture' : 'Add Picture'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Sections */}
      {profileSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.menuItem}
                onPress={item.action || undefined}
                disabled={!item.action}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon as any} size={24} color="#636e72" style={styles.menuIcon} />
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    {item.value && <Text style={styles.menuItemValue}>{item.value}</Text>}
                  </View>
                </View>
                {item.isSwitch ? (
                  <Switch
                    value={item.switchValue}
                    onValueChange={item.onSwitchChange}
                    trackColor={{ false: '#dfe6e9', true: '#00b894' }}
                    thumbColor={item.switchValue ? '#fff' : '#636e72'}
                  />
                ) : item.action ? (
                  <Ionicons name="chevron-forward" size={20} color="#b2bec3" />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Copyright Section */}
      <View style={styles.copyrightSection}>
        <Text style={styles.copyrightText}>
          2026 FinanceFlow
        </Text>
        <Text style={styles.copyrightSubtext}>
          Made  by Asadullah and Taimoor
        </Text>
        <Text style={styles.copyrightSubtext2}>
          All rights reserved. For better financial management.
        </Text>
        <Text style={styles.versionText}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#636e72',
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  profilePictureContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  profilePicturePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  changePictureTextContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  changePictureText: {
    fontSize: 14,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    marginBottom: 2,
  },
  menuItemValue: {
    fontSize: 14,
    color: '#636e72',
  },
  logoutSection: {
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  copyrightText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  copyrightSubtext: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  copyrightSubtext2: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#b2bec3',
    fontWeight: '500',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});