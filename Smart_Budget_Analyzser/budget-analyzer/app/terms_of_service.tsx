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

export default function TermsOfServiceScreen() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>Last Updated: August 2026</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                     <Text style={styles.sectionText}>
             By downloading, installing, or using the FinanceFlow mobile application, 
             you agree to be bound by these Terms of Service. If you do not agree to these terms, 
             please do not use our application.
           </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
                     <Text style={styles.sectionText}>
             FinanceFlow is a financial management application that helps users track 
             expenses, set financial goals, manage budgets, and gain insights into their spending patterns. 
             Our service includes:
           </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Transaction tracking and categorization</Text>
            <Text style={styles.bulletPoint}>• Financial goal setting and monitoring</Text>
            <Text style={styles.bulletPoint}>• Budget management and spending limits</Text>
            <Text style={styles.bulletPoint}>• AI-powered spending insights and recommendations</Text>
            <Text style={styles.bulletPoint}>• Notification and reminder services</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.sectionText}>
            To use our service, you must create an account. You are responsible for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Providing accurate and complete information</Text>
            <Text style={styles.bulletPoint}>• Maintaining the security of your account credentials</Text>
            <Text style={styles.bulletPoint}>• All activities that occur under your account</Text>
            <Text style={styles.bulletPoint}>• Notifying us immediately of any unauthorized use</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
          <Text style={styles.sectionText}>
            You agree to use our service only for lawful purposes and in accordance with these terms. 
            You agree not to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Use the service for any illegal or unauthorized purpose</Text>
            <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to our systems</Text>
            <Text style={styles.bulletPoint}>• Interfere with or disrupt the service</Text>
            <Text style={styles.bulletPoint}>• Share your account credentials with others</Text>
            <Text style={styles.bulletPoint}>• Use the service to store or transmit malicious code</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Privacy and Data</Text>
          <Text style={styles.sectionText}>
            Your privacy is important to us. Our collection and use of your personal information 
            is governed by our Privacy Policy, which is incorporated into these terms by reference. 
            By using our service, you consent to our collection and use of information as described 
            in our Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Financial Information</Text>
          <Text style={styles.sectionText}>
            Our service allows you to input and track financial information. You acknowledge that:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• You are responsible for the accuracy of your financial data</Text>
            <Text style={styles.bulletPoint}>• We are not a financial institution or advisor</Text>
            <Text style={styles.bulletPoint}>• Our insights and recommendations are for informational purposes only</Text>
            <Text style={styles.bulletPoint}>• You should consult with qualified professionals for financial advice</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Service Availability</Text>
          <Text style={styles.sectionText}>
            We strive to provide reliable service but cannot guarantee uninterrupted availability. 
            We may temporarily suspend or discontinue the service for maintenance, updates, or 
            other reasons. We are not liable for any damages resulting from service interruptions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
                     <Text style={styles.sectionText}>
             The FinanceFlow application, including its design, features, and content, 
             is owned by us and protected by intellectual property laws. You may not copy, modify, 
             distribute, or create derivative works without our express written consent.
           </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            To the maximum extent permitted by law, we shall not be liable for any indirect, 
            incidental, special, consequential, or punitive damages, including but not limited 
            to loss of profits, data, or use, arising from your use of our service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Termination</Text>
          <Text style={styles.sectionText}>
            You may terminate your account at any time by contacting us. We may terminate or 
            suspend your account if you violate these terms. Upon termination, your right to 
            use the service will cease immediately, and we may delete your account data.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
          <Text style={styles.sectionText}>
            We may modify these terms at any time. We will notify you of significant changes 
            by posting the updated terms in the app or sending you a notification. Your continued 
            use of the service after changes become effective constitutes acceptance of the new terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Governing Law</Text>
          <Text style={styles.sectionText}>
            These terms are governed by and construed in accordance with the laws of Pakistan. 
            Any disputes arising from these terms or your use of the service shall be resolved 
            in the courts of Pakistan.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>Email: taimoorvri@gmail.com</Text>
            <Text style={styles.contactText}>Support: taimoorvri@gmail.com</Text>
          </View>
        </View>

                 <View style={styles.footer}>
           <Text style={styles.footerText}>
             By using FinanceFlow, you acknowledge that you have read, understood, 
             and agree to be bound by these Terms of Service.
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