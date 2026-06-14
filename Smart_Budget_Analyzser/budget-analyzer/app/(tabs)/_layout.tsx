import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../_layout';
import { supabase } from '../supabase';

// Import your screen components
import HomeScreen from './index';
import BudgetScreen from './budget';
import AnalyticsScreen from './analytics';
import ProfileScreen from './profile';
import ToolsScreen from './tools';

const { width: screenWidth } = Dimensions.get('window');

// Create animated values outside component to prevent recreation
const fadeAnim = new Animated.Value(0);
const scaleAnim = new Animated.Value(0.8);

export default function RootLayout() {
  const { userName, userId } = useContext(AuthContext);
  const [selectedTab, setSelectedTab] = React.useState('Home');
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const loadProfileImage = useCallback(async () => {
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
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  }, [userId]);

  useEffect(() => {
    // Load profile image when user changes or component mounts
    loadProfileImage();
  }, [userId, loadProfileImage]);

  // Reload profile image when switching tabs (especially when coming back from Profile)
  useEffect(() => {
    if (selectedTab === 'Home' || selectedTab === 'Budget' || selectedTab === 'Analytics' || selectedTab === 'Tools') {
      loadProfileImage();
    }
  }, [selectedTab, loadProfileImage]);

  const showProfileModal = () => {
    console.log('Opening profile modal, profileImage:', profileImage);
    setProfileModalVisible(true);
    // Reset animations first
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    // Then animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideProfileModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setProfileModalVisible(false);
    });
  };

  const renderScreen = () => {
    switch (selectedTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Budget':
        return <BudgetScreen />;
      case 'Analytics':
        return <AnalyticsScreen />;
      case 'Tools':
        return <ToolsScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const _renderIcon = (routeName: string) => {
    let icon = '';

    switch (routeName) {
      case 'Home':
        icon = 'home';
        break;
      case 'Budget':
        icon = 'wallet';
        break;
      case 'Analytics':
        icon = 'analytics';
        break;
      case 'Tools':
        icon = 'calculator';
        break;
      case 'Profile':
        icon = 'person';
        break;
    }

    return (
      <Ionicons
        name={icon as any}
        size={25}
        color={routeName === selectedTab ? '#6366f1' : '#8e8e93'}
      />
    );
  };

  const renderTabBar = () => {
    return (
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setSelectedTab('Home')}
          style={styles.tabbarItem}
        >
          {_renderIcon('Home')}
          <Text style={[
            styles.tabbarText,
            { color: 'Home' === selectedTab ? '#6366f1' : '#8e8e93' }
          ]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTab('Budget')}
          style={styles.tabbarItem}
        >
          {_renderIcon('Budget')}
          <Text style={[
            styles.tabbarText,
            { color: 'Budget' === selectedTab ? '#6366f1' : '#8e8e93' }
          ]}>
            Budget
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTab('Analytics')}
          style={styles.tabbarItem}
        >
          {_renderIcon('Analytics')}
          <Text style={[
            styles.tabbarText,
            { color: 'Analytics' === selectedTab ? '#6366f1' : '#8e8e93' }
          ]}>
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTab('Tools')}
          style={styles.tabbarItem}
        >
          {_renderIcon('Tools')}
          <Text style={[
            styles.tabbarText,
            { color: 'Tools' === selectedTab ? '#6366f1' : '#8e8e93' }
          ]}>
            Tools
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTab('Profile')}
          style={styles.tabbarItem}
        >
          {_renderIcon('Profile')}
          <Text style={[
            styles.tabbarText,
            { color: 'Profile' === selectedTab ? '#6366f1' : '#8e8e93' }
          ]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4f8cff', '#6a82fb', '#a18cd1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <TouchableOpacity onPress={showProfileModal} style={styles.profileContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.defaultProfile}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Welcome {userName || 'User'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationIcon}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Profile Picture Modal */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideProfileModal}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={hideProfileModal} activeOpacity={1}>
          <Animated.View style={[styles.profileModal, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              {/* Close Button - Top Right */}
              <TouchableOpacity onPress={hideProfileModal} style={styles.modalCloseButton}>
                <View style={styles.modalCloseIconContainer}>
                  <Ionicons name="close" size={28} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* Full Square Profile Picture */}
              <View style={styles.imageContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profilePictureLarge} resizeMode="cover" />
                ) : (
                  <View style={[styles.profilePictureLarge, styles.defaultProfileLarge]}>
                    <Ionicons name="person" size={140} color="#b2bec3" />
                  </View>
                )}
              </View>

              {/* User Info and Button Below Image */}
              <View style={styles.modalFooter}>
                <Text style={styles.modalUserName}>{userName || 'User'}</Text>
                <TouchableOpacity 
                  style={styles.viewProfileButton} 
                  onPress={() => { setSelectedTab('Profile'); hideProfileModal(); }}
                >
                  <Ionicons name="person-outline" size={18} color="#4f8cff" />
                  <Text style={styles.viewProfileButtonText}>View Full Profile</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Main Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Custom Curved Bottom Bar */}
      <View style={styles.bottomBarContainer}>
        {renderTabBar()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  defaultProfile: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  notificationIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModal: {
    width: screenWidth * 0.9,
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  modalCloseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.9,
    maxWidth: 380,
    maxHeight: 380,
    backgroundColor: '#f0f0f0',
  },
  profilePictureLarge: {
    width: '100%',
    height: '100%',
  },
  defaultProfileLarge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 16,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#4f8cff',
  },
  viewProfileButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4f8cff',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  bottomBarContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    paddingBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  tabbarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabbarText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
