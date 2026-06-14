import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

class ExpoNotificationService {
  private static instance: ExpoNotificationService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): ExpoNotificationService {
    if (!ExpoNotificationService.instance) {
      ExpoNotificationService.instance = new ExpoNotificationService();
    }
    return ExpoNotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      // Create default notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'FinanceFlow Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4f8cff',
          sound: 'default',
        });
        await Notifications.setNotificationChannelAsync('goals', {
          name: 'Goal Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00b894',
          sound: 'default',
        });
        await Notifications.setNotificationChannelAsync('alerts', {
          name: 'Financial Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#e84393',
          sound: 'default',
        });
      }

      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
      }

      this.isInitialized = true;
      console.log('✅ ExpoNotificationService initialized');
    } catch (error) {
      console.error('❌ Error initializing ExpoNotificationService:', error);
    }
  }

  async showImmediateNotification(title: string, message: string, data?: any): Promise<void> {
    try {
      await this.initialize();
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: data ?? {},
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'default' }),
        },
        trigger: null, // fire immediately
      });
      console.log('✅ Immediate notification sent:', title);
    } catch (error) {
      console.error('❌ Error showing immediate notification:', error);
    }
  }

  async showGoalProgressCelebration(goalId: string, goalName: string, progress: number): Promise<void> {
    try {
      await this.initialize();
      const milestones: Record<number, string> = {
        25: "You're 25% of the way there! Keep going 💪",
        50: "Halfway there! Amazing progress 🌟",
        75: "75% done! The finish line is near 🏁",
        100: "You did it! Goal fully achieved! 🎊",
      };
      const body = milestones[progress] ?? `You've reached ${progress}% of your goal!`;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎉 ${goalName} — ${progress}% Complete!`,
          body,
          data: { goalId, goalName, progress, type: 'goal_progress' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'goals' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error showing goal progress notification:', error);
    }
  }

  async showGoalAchievement(goalId: string, goalName: string): Promise<void> {
    try {
      await this.initialize();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Goal Achieved!',
          body: `Congratulations! You've successfully completed "${goalName}"!`,
          data: { goalId, goalName, type: 'goal_achievement' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'goals' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error showing goal achievement notification:', error);
    }
  }

  async showOverspendingAlert(category: string, spent: number, budget: number): Promise<void> {
    try {
      await this.initialize();
      const overBy = Math.round(spent - budget);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Overspending: ${category}`,
          body: `You've exceeded your ${category} budget by ₨${overBy.toLocaleString()}. Consider reviewing your spending.`,
          data: { category, spent, budget, type: 'overspending_alert' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'alerts' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error showing overspending alert:', error);
    }
  }

  async showUnusualTransactionAlert(amount: number, description: string): Promise<void> {
    try {
      await this.initialize();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔍 Unusual Transaction Detected',
          body: `A transaction of ₨${Math.round(amount).toLocaleString()} for "${description}" seems unusual. Please verify.`,
          data: { amount, description, type: 'unusual_transaction' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'alerts' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error showing unusual transaction alert:', error);
    }
  }

  async showBudgetExceedingAlert(category: string, spent: number, budget: number): Promise<void> {
    try {
      await this.initialize();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💰 Budget Limit Reached: ${category}`,
          body: `Your ${category} budget of ₨${Math.round(budget).toLocaleString()} has been reached. Spent: ₨${Math.round(spent).toLocaleString()}.`,
          data: { category, spent, budget, type: 'budget_exceeded' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'alerts' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error showing budget exceeding alert:', error);
    }
  }
}

export default ExpoNotificationService;