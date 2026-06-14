import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function HelpSupportScreen() {
  const router = useRouter();

     const handleEmailSupport = () => {
     Linking.openURL('mailto:taimoorvri@gmail.com?subject=FinanceFlow Support');
   };

  const faqs = [
    {
      question: 'How do I add a new transaction?',
      answer: 'Go to the Transaction tab and tap the + button. Fill in the amount, category, description, and date, then tap Save.'
    },
    {
      question: 'How do I set up a financial goal?',
      answer: 'Go to the Goals tab and tap the + button. Enter the goal name, target amount, due date, and time, then tap Save.'
    },
    {
      question: 'How do I change my currency?',
      answer: 'Go to Profile → Preferences → Currency and select your preferred currency from the options.'
    },
    {
      question: 'How do I enable fingerprint login?',
      answer: 'Go to Profile → Preferences → Fingerprint Login and toggle the switch. Make sure to check "Remember Me" during login.'
    },
    {
      question: 'How do I set category budget limits?',
      answer: 'Go to Profile → Category Budget Limits and tap on any category to set a monthly spending limit.'
    },
    {
      question: 'How do I customize notifications?',
      answer: 'Go to Profile → Notifications to manage all your notification preferences including goals, financial alerts, and AI insights.'
    },
    {
      question: 'What are AI-powered insights?',
      answer: 'Our AI analyzes your spending patterns and provides personalized recommendations for better financial management.'
    },
    {
      question: 'How do I change my profile picture?',
      answer: 'Go to Profile and tap on your profile picture area to select a new image from your gallery.'
    }
  ];

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={handleEmailSupport}>
            <Ionicons name="mail-outline" size={32} color="#007AFF" />
            <Text style={styles.actionTitle}>Email Support</Text>
            <Text style={styles.actionSubtitle}>Get direct help</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/privacy_policy')}>
            <Ionicons name="shield-outline" size={32} color="#007AFF" />
            <Text style={styles.actionTitle}>Privacy Policy</Text>
            <Text style={styles.actionSubtitle}>Data protection</Text>
          </TouchableOpacity>
        </View>

        {/* Getting Started */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Getting Started</Text>
          <View style={styles.stepList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Add Your First Transaction</Text>
                <Text style={styles.stepDescription}>
                  Start by adding your first expense or income transaction to begin tracking your finances.
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Set Financial Goals</Text>
                <Text style={styles.stepDescription}>
                  Create goals for savings, purchases, or any financial target you want to achieve.
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Customize Your Experience</Text>
                <Text style={styles.stepDescription}>
                  Set your preferred currency, enable notifications, and adjust budget limits.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Features Guide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 App Features</Text>
          <View style={styles.featureList}>
            <View style={styles.feature}>
              <Ionicons name="wallet-outline" size={24} color="#007AFF" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Transaction Tracking</Text>
                <Text style={styles.featureDescription}>
                  Log all your income and expenses with categories and descriptions.
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="flag-outline" size={24} color="#007AFF" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Goal Management</Text>
                <Text style={styles.featureDescription}>
                  Set financial goals and track your progress with notifications.
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="analytics-outline" size={24} color="#007AFF" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>AI Insights</Text>
                <Text style={styles.featureDescription}>
                  Get personalized spending insights and budget recommendations.
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="notifications-outline" size={24} color="#007AFF" />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Smart Notifications</Text>
                <Text style={styles.featureDescription}>
                  Receive alerts for goals, overspending, and financial insights.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Contact Us</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color="#007AFF" />
              <Text style={styles.contactText}>taimoorvri@gmail.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="time-outline" size={20} color="#007AFF" />
              <Text style={styles.contactText}>Response within 24 hours</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Send Email</Text>
          </TouchableOpacity>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Pro Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipText}>• Log transactions regularly for better insights</Text>
            <Text style={styles.tipText}>• Set realistic goals with achievable timelines</Text>
            <Text style={styles.tipText}>• Use category budget limits to control spending</Text>
            <Text style={styles.tipText}>• Enable notifications to stay on track</Text>
            <Text style={styles.tipText}>• Review your analytics monthly for trends</Text>
          </View>
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
  stepList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  featureList: {
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  faqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactInfo: {
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsList: {
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 