import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>Last Updated: August 2026</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            We collect information you provide directly to us, such as when you create an account, 
            add transactions, set financial goals, or contact us for support. This may include:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Personal information (name, email address)</Text>
            <Text style={styles.bulletPoint}>• Financial data (transactions, goals, budgets)</Text>
            <Text style={styles.bulletPoint}>• App usage data and preferences</Text>
            <Text style={styles.bulletPoint}>• Device information and analytics</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            We use the information we collect to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Provide and maintain our financial tracking services</Text>
            <Text style={styles.bulletPoint}>• Process your transactions and goals</Text>
            <Text style={styles.bulletPoint}>• Send you notifications and updates</Text>
            <Text style={styles.bulletPoint}>• Improve our app and user experience</Text>
            <Text style={styles.bulletPoint}>• Provide customer support</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Security</Text>
          <Text style={styles.sectionText}>
            We implement appropriate security measures to protect your personal and financial information:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• End-to-end encryption for sensitive data</Text>
            <Text style={styles.bulletPoint}>• Secure cloud storage with Supabase</Text>
            <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
            <Text style={styles.bulletPoint}>• Access controls and authentication</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.sectionText}>
            We do not sell, trade, or rent your personal information to third parties. 
            We may share your information only in the following circumstances:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• With your explicit consent</Text>
            <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>
            <Text style={styles.bulletPoint}>• To protect our rights and safety</Text>
            <Text style={styles.bulletPoint}>• With trusted service providers (under strict confidentiality)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Access your personal data</Text>
            <Text style={styles.bulletPoint}>• Correct inaccurate information</Text>
            <Text style={styles.bulletPoint}>• Delete your account and data</Text>
            <Text style={styles.bulletPoint}>• Opt-out of notifications</Text>
            <Text style={styles.bulletPoint}>• Export your financial data</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention</Text>
          <Text style={styles.sectionText}>
            We retain your information for as long as your account is active or as needed 
            to provide you services. You can delete your account at any time, and we will 
            permanently delete your data within 30 days.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          <Text style={styles.sectionText}>
            Our app is not intended for children under 13 years of age. We do not knowingly 
            collect personal information from children under 13. If you are a parent or guardian 
            and believe your child has provided us with personal information, please contact us.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
          <Text style={styles.sectionText}>
            We may update this Privacy Policy from time to time. We will notify you of any 
            changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about this Privacy Policy or our data practices, 
            please contact us at:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>Email: taimoorvri@gmail.com</Text>
            <Text style={styles.contactText}>Support: taimoorvri@gmail.com</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using our app, you agree to the collection and use of information in accordance 
            with this Privacy Policy.
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
  lastUpdated: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
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
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  contactInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  footer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
}); 