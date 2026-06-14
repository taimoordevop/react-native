import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import NotificationService from './services/NotificationService';

export interface NotificationSettings {
  goals: {
    dueDateReminders: boolean;
    progressCelebrations: boolean;
    contributionReminders: boolean;
  };
  financial: {
    overspendingAlerts: boolean;
    unusualTransactionAlerts: boolean;
    budgetWarnings: boolean;
  };
  reminders: {
    dailyLogging: boolean;
    weeklyReview: boolean;
    monthlySummary: boolean;
  };
  aiInsights: {
    weeklyInsights: boolean;
    budgetTips: boolean;
    savingsOpportunities: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    goals: {
      dueDateReminders: true,
      progressCelebrations: true,
      contributionReminders: true,
    },
    financial: {
      overspendingAlerts: true,
      unusualTransactionAlerts: true,
      budgetWarnings: true,
    },
    reminders: {
      dailyLogging: true,
      weeklyReview: true,
      monthlySummary: true,
    },
    aiInsights: {
      weeklyInsights: true,
      budgetTips: true,
      savingsOpportunities: true,
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const ensurePermission = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('⚠️ Notification permission denied by user');
      return false;
    }
    return true;
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await SecureStore.setItemAsync('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      const granted = await ensurePermission();
      if (!granted) return;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Test Notification',
          body: 'Notifications are working perfectly! You will receive scheduled reminders based on your settings.',
          data: { type: 'test' },
          sound: 'default',
        },
        trigger: null, // immediate
      });
      console.log('✅ Test notification sent');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  };

  const toggleSetting = async (category: keyof NotificationSettings, setting: string) => {
    const newValue = !(settings[category] as any)[setting];

    // If turning ON any notification, ensure OS permission is granted
    if (newValue && category !== 'quietHours') {
      const granted = await ensurePermission();
      if (!granted) return;
    }

    const newSettings = { ...settings };
    (newSettings[category] as any)[setting] = newValue;
    saveSettings(newSettings);

    // Get userId for scheduling
    const userId = await SecureStore.getItemAsync('userId');
    if (!userId && category !== 'quietHours') {
      console.warn('⚠️ No userId found, cannot schedule notifications');
      return;
    }

    // Apply setting changes to NotificationService based on category and setting
    try {
      if (category === 'reminders') {
        if (setting === 'dailyLogging') {
          if (newValue) {
            await NotificationService.scheduleDailyLoggingReminder(userId!);
          } else {
            await NotificationService.cancelNotification(`daily_logging_${userId}`);
          }
        } else if (setting === 'weeklyReview') {
          if (newValue) {
            await NotificationService.scheduleWeeklySpendingSummary(userId!);
          } else {
            await NotificationService.cancelNotification(`weekly_summary_${userId}`);
          }
        } else if (setting === 'monthlySummary') {
          if (newValue) {
            await NotificationService.scheduleMonthlyBudgetReview(userId!);
          } else {
            await NotificationService.cancelNotification(`monthly_review_${userId}`);
          }
        }
      } else if (category === 'goals') {
        if (setting === 'contributionReminders') {
          if (newValue) {
            await NotificationService.scheduleSavingsGoalReminders(userId!);
          } else {
            await NotificationService.cancelNotification(`savings_reminder_${userId}`);
          }
        }
        // dueDateReminders and progressCelebrations are handled per-goal dynamically
      } else if (category === 'aiInsights') {
        if (setting === 'weeklyInsights' && newValue) {
          await NotificationService.initializeAIPoweredNotifications(userId!);
        }
      }
    } catch (error) {
      console.error('❌ Error toggling notification setting:', error);
    }
  };

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    icon: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <Ionicons name={icon as any} size={20} color="#007AFF" />
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const renderSection = (
    title: string,
    icon: string,
    settings: any,
    category: keyof NotificationSettings
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={24} color="#007AFF" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
             {Object.entries(settings).map(([key, value]) => {
         const settingKey = key as string;
         const settingValue = value as boolean;
         
         const settingConfigs = {
           dueDateReminders: {
             title: 'Due Date Reminders',
             description: 'Get notified when goals are approaching their due date',
             icon: 'calendar',
           },
           progressCelebrations: {
             title: 'Progress Celebrations',
             description: 'Celebrate when you reach goal milestones (25%, 50%, 75%)',
             icon: 'trophy',
           },
           contributionReminders: {
             title: 'Contribution Reminders',
             description: 'Weekly reminders to add money to your goals',
             icon: 'add-circle',
           },
           overspendingAlerts: {
             title: 'Overspending Alerts',
             description: 'Get warned when you exceed budget limits',
             icon: 'warning',
           },
           unusualTransactionAlerts: {
             title: 'Unusual Transaction Alerts',
             description: 'Get notified of transactions higher than your average',
             icon: 'alert-circle',
           },
           budgetWarnings: {
             title: 'Budget Warnings',
             description: 'Warnings when approaching monthly spending limits',
             icon: 'wallet',
           },
           dailyLogging: {
             title: 'Daily Logging Reminders',
             description: 'Daily reminders to log your transactions',
             icon: 'document-text',
           },
           weeklyReview: {
             title: 'Weekly Review',
             description: 'Weekly financial summary and insights',
             icon: 'analytics',
           },
           monthlySummary: {
             title: 'Monthly Summary',
             description: 'Comprehensive monthly financial report',
             icon: 'bar-chart',
           },
           weeklyInsights: {
             title: 'Weekly AI Insights',
             description: 'AI-generated spending pattern analysis',
             icon: 'brain',
           },
           budgetTips: {
             title: 'Budget Optimization Tips',
             description: 'AI suggestions for better financial management',
             icon: 'bulb',
           },
           savingsOpportunities: {
             title: 'Savings Opportunities',
             description: 'AI-identified potential savings areas',
             icon: 'trending-up',
           },
         };

         const config = settingConfigs[settingKey as keyof typeof settingConfigs];
         
         return (
           <View key={`${category}-${settingKey}`}>
             {renderSettingItem(
               config.title,
               config.description,
               settingValue,
               () => toggleSetting(category, settingKey),
               config.icon
             )}
           </View>
         );
       })}
    </View>
  );

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
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
          <Ionicons name="notifications" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Customize your notification preferences to stay informed about your financial goals and spending patterns.
          </Text>
        </View>

        {renderSection('🎯 Goal Notifications', 'flag', settings.goals, 'goals')}
        {renderSection('💰 Financial Alerts', 'wallet', settings.financial, 'financial')}
        {renderSection('📝 Reminders', 'time', settings.reminders, 'reminders')}
        {renderSection('🤖 AI Insights', 'brain', settings.aiInsights, 'aiInsights')}

        {/* Quiet Hours Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="moon" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Ionicons name="moon" size={20} color="#007AFF" />
                <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
              </View>
              <Text style={styles.settingDescription}>
                Mute notifications during specified hours (10 PM - 8 AM)
              </Text>
            </View>
            <Switch
              value={settings.quietHours.enabled}
              onValueChange={() => toggleSetting('quietHours', 'enabled')}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor={settings.quietHours.enabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

                <View style={styles.footer}>
          <Text style={styles.footerText}>
            Notifications help you stay on track with your financial goals and provide valuable insights about your spending patterns.
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
  testButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1976d2',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

}); 