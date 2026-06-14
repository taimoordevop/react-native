import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

     const handleEmailContact = () => {
     Linking.openURL('mailto:taimoorvri@gmail.com?subject=FinanceFlow Feedback');
   };

  const handlePrivacyPolicy = () => {
    router.push('/privacy_policy');
  };

  const handleTermsOfService = () => {
    router.push('/terms_of_service');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo and Title */}
        <View style={styles.appInfo}>
          <View style={styles.logoContainer}>
            <Ionicons name="wallet" size={60} color="#007AFF" />
          </View>
          <Text style={styles.appName}>FinanceFlow</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>
            Your intelligent companion for better financial management
          </Text>
        </View>

        {/* App Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 About the App</Text>
                     <Text style={styles.description}>
             FinanceFlow is a comprehensive financial management application designed 
             to help you take control of your finances. With AI-powered insights, smart notifications, 
             and intuitive goal tracking, we make financial management simple and effective.
           </Text>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Key Features</Text>
          <View style={styles.featureList}>
            <View style={styles.feature}>
              <Ionicons name="wallet-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Smart Transaction Tracking</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="flag-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Goal Management & Progress</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="analytics-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>AI-Powered Insights</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="notifications-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Smart Notifications</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="card-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Category Budget Limits</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="finger-print-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Secure Biometric Login</Text>
            </View>
          </View>
        </View>

        {/* Developers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍💻 Developers</Text>
          <View style={styles.developerInfo}>
            <Text style={styles.developerText}>
              Made with ❤️ by
            </Text>
            <View style={styles.developerNames}>
              <Text style={styles.developerName}>Asadullah</Text>
              <Text style={styles.developerSeparator}>and</Text>
              <Text style={styles.developerName}>Taimoor</Text>
            </View>
            <Text style={styles.developerDescription}>
              Passionate developers dedicated to creating innovative solutions 
              that make financial management accessible to everyone.
            </Text>
          </View>
        </View>

        {/* Technology Stack */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Built With</Text>
          <View style={styles.techList}>
            <View style={styles.techItem}>
              <Ionicons name="logo-react" size={24} color="#61DAFB" />
              <Text style={styles.techText}>React Native</Text>
            </View>
            <View style={styles.techItem}>
              <Ionicons name="logo-javascript" size={24} color="#F7DF1E" />
              <Text style={styles.techText}>TypeScript</Text>
            </View>
            <View style={styles.techItem}>
              <Ionicons name="cloud-outline" size={24} color="#3ECF8E" />
              <Text style={styles.techText}>Supabase</Text>
            </View>
            <View style={styles.techItem}>
              <Ionicons name="brain-outline" size={24} color="#FF6B6B" />
              <Text style={styles.techText}>AI/ML</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Quick Links</Text>
          <View style={styles.actionList}>
            <TouchableOpacity style={styles.actionItem} onPress={handleEmailContact}>
              <Ionicons name="mail-outline" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Contact Us</Text>
              <Ionicons name="chevron-forward" size={20} color="#b2bec3" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handlePrivacyPolicy}>
              <Ionicons name="shield-outline" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#b2bec3" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleTermsOfService}>
              <Ionicons name="document-text-outline" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color="#b2bec3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 App Information</Text>
          <View style={styles.statsList}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Version</Text>
              <Text style={styles.statValue}>1.0.0</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Build</Text>
              <Text style={styles.statValue}>2026.08.01</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Platform</Text>
              <Text style={styles.statValue}>iOS & Android</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Size</Text>
              <Text style={styles.statValue}>~25 MB</Text>
            </View>
          </View>
        </View>

        {/* Copyright */}
                 <View style={styles.copyrightSection}>
           <Text style={styles.copyrightText}>
             © 2026 FinanceFlow
           </Text>
          <Text style={styles.copyrightSubtext}>
            All rights reserved. Made with ❤️ for better financial management.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  featureList: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  developerInfo: {
    alignItems: 'center',
  },
  developerText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  developerNames: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  developerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  developerSeparator: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  developerDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  techList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  techItem: {
    alignItems: 'center',
    marginBottom: 16,
    width: '45%',
  },
  techText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  actionList: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  statsList: {
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  copyrightText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 