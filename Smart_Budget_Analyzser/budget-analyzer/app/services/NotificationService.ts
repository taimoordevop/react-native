import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const SCHEDULED_IDS_KEY = 'notification_scheduled_ids';

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private smartRemindersInitialized = new Set<string>();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
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
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Periodic Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#fdcb6e',
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
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
      }
      this.isInitialized = true;
      console.log('✅ NotificationService initialized');
    } catch (error) {
      console.error('❌ Error initializing NotificationService:', error);
    }
  }

  // ─── Helper: persist scheduled identifier ─────────────────────────────────
  private async saveScheduledId(key: string, id: string): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[key] = id;
      await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(map));
    } catch { /* ignore */ }
  }

  private async cancelByKey(key: string): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
      if (!raw) return;
      const map: Record<string, string> = JSON.parse(raw);
      if (map[key]) {
        await Notifications.cancelScheduledNotificationAsync(map[key]);
        delete map[key];
        await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(map));
      }
    } catch { /* ignore */ }
  }

  // ─── Goal: due date reminder ───────────────────────────────────────────────
  async scheduleGoalDueDateReminder(
    goalId: string, goalName: string, dueDate: Date, dueTime: string
  ): Promise<void> {
    try {
      await this.initialize();
      const timeParts = dueTime.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const dueDateTime = new Date(
        dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(),
        hours, minutes, 0
      );
      const now = new Date();

      // Cancel any existing reminder for this goal
      await this.cancelByKey(`goal_due_${goalId}`);
      await this.cancelByKey(`goal_due_1day_${goalId}`);

      // Schedule exact due date notification
      if (dueDateTime.getTime() > now.getTime() + 60000) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎯 Goal Due Now!',
            body: `It's time for your goal "${goalName}"! Check your achievement.`,
            data: { goalId, goalName, type: 'goal_due' },
            sound: 'default',
            ...(Platform.OS === 'android' && { channelId: 'goals' }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: dueDateTime,
          },
        });
        await this.saveScheduledId(`goal_due_${goalId}`, id);
        console.log('✅ Goal due-date notification scheduled:', goalName, dueDateTime.toLocaleString());
      }

      // Schedule 1-day-before reminder
      const oneDayBefore = new Date(dueDateTime.getTime() - 24 * 60 * 60 * 1000);
      if (oneDayBefore.getTime() > now.getTime()) {
        const id1d = await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Goal Reminder',
            body: `Your goal "${goalName}" is due tomorrow! Stay on track.`,
            data: { goalId, goalName, type: 'goal_due_1day' },
            sound: 'default',
            ...(Platform.OS === 'android' && { channelId: 'goals' }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: oneDayBefore,
          },
        });
        await this.saveScheduledId(`goal_due_1day_${goalId}`, id1d);
        console.log('✅ 1-day reminder scheduled for goal:', goalName);
      }
    } catch (error) {
      console.error('❌ Error scheduling goal due-date reminder:', error);
    }
  }

  // ─── Goal: progress celebrations (immediate) ──────────────────────────────
  async scheduleGoalProgressCelebration(goalId: string, goalName: string, progress: number): Promise<void> {
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
      console.error('❌ Error scheduling goal progress notification:', error);
    }
  }

  // ─── Goal: achievement (immediate) ────────────────────────────────────────
  async scheduleGoalAchievement(goalId: string, goalName: string): Promise<void> {
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
      console.error('❌ Error scheduling goal achievement notification:', error);
    }
  }

  // ─── Financial alerts (immediate) ─────────────────────────────────────────
  async scheduleOverspendingAlert(category: string, spent: number, budget: number): Promise<void> {
    try {
      await this.initialize();
      const overBy = Math.round(spent - budget);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Overspending: ${category}`,
          body: `You've exceeded your ${category} budget by ₨${overBy.toLocaleString()}.`,
          data: { category, spent, budget, type: 'overspending_alert' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'alerts' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error scheduling overspending alert:', error);
    }
  }

  async scheduleUnusualTransactionAlert(amount: number, description: string): Promise<void> {
    try {
      await this.initialize();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔍 Unusual Transaction Detected',
          body: `A transaction of ₨${Math.round(amount).toLocaleString()} for "${description}" seems unusual.`,
          data: { amount, description, type: 'unusual_transaction' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'alerts' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error scheduling unusual transaction alert:', error);
    }
  }

  // ─── AI insights (immediate) ──────────────────────────────────────────────
  async scheduleAIInsights(insights: string): Promise<void> {
    try {
      await this.initialize();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🤖 AI Financial Insights',
          body: insights,
          data: { type: 'ai_insights' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'default' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error scheduling AI insights:', error);
    }
  }

  // ─── Weekly spending summary (every Sunday 9 PM) ──────────────────────────
  async scheduleWeeklySpendingSummary(userId: string): Promise<void> {
    try {
      await this.initialize();
      await this.cancelByKey(`weekly_summary_${userId}`);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Weekly Spending Summary',
          body: 'Your weekly spending report is ready! Check your patterns and stay on track.',
          data: { userId, type: 'weekly_summary' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'reminders' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday (1 = Sunday in expo-notifications)
          hour: 21,
          minute: 0,
        },
      });
      await this.saveScheduledId(`weekly_summary_${userId}`, id);
      console.log('✅ Weekly summary scheduled (every Sunday 9 PM)');
    } catch (error) {
      console.error('❌ Error scheduling weekly summary:', error);
    }
  }

  // ─── Monthly budget review (1st of month at 10 AM) ────────────────────────
  async scheduleMonthlyBudgetReview(userId: string): Promise<void> {
    try {
      await this.initialize();
      await this.cancelByKey(`monthly_review_${userId}`);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📈 Monthly Budget Review',
          body: 'Time to review your monthly budget! See how you performed and plan for next month.',
          data: { userId, type: 'monthly_review' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'reminders' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: 1,
          hour: 10,
          minute: 0,
        },
      });
      await this.saveScheduledId(`monthly_review_${userId}`, id);
      console.log('✅ Monthly review scheduled (1st of month, 10 AM)');
    } catch (error) {
      console.error('❌ Error scheduling monthly review:', error);
    }
  }

  // ─── Savings goal reminder (every Wednesday 8 PM) ─────────────────────────
  async scheduleSavingsGoalReminders(userId: string): Promise<void> {
    try {
      await this.initialize();
      await this.cancelByKey(`savings_reminder_${userId}`);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Savings Goal Reminder',
          body: "Don't forget to contribute to your savings goals this week! Every bit counts.",
          data: { userId, type: 'savings_reminder' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'reminders' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 4, // Wednesday (4 = Wednesday)
          hour: 20,
          minute: 0,
        },
      });
      await this.saveScheduledId(`savings_reminder_${userId}`, id);
      console.log('✅ Savings reminder scheduled (every Wednesday 8 PM)');
    } catch (error) {
      console.error('❌ Error scheduling savings reminder:', error);
    }
  }

  // ─── Daily logging reminder (9 PM daily) ─────────────────────────────────
  async scheduleDailyLoggingReminder(userId: string): Promise<void> {
    try {
      await this.initialize();
      await this.cancelByKey(`daily_logging_${userId}`);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📝 Daily Expense Log',
          body: "Don't forget to log today's expenses! Keep your budget on track.",
          data: { userId, type: 'daily_logging' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'reminders' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 21,
          minute: 0,
        },
      });
      await this.saveScheduledId(`daily_logging_${userId}`, id);
      console.log('✅ Daily logging reminder scheduled (9 PM daily)');
    } catch (error) {
      console.error('❌ Error scheduling daily logging reminder:', error);
    }
  }

  // ─── Smart reminders init ─────────────────────────────────────────────────
  async initializeSmartReminders(userId: string): Promise<void> {
    if (this.smartRemindersInitialized.has(userId)) return;
    try {
      await this.scheduleWeeklySpendingSummary(userId);
      await this.scheduleMonthlyBudgetReview(userId);
      await this.scheduleSavingsGoalReminders(userId);
      this.smartRemindersInitialized.add(userId);
      console.log('✅ Smart reminders initialized for user:', userId);
    } catch (error) {
      console.error('❌ Error initializing smart reminders:', error);
    }
  }

  // ─── AI-powered notifications init ───────────────────────────────────────
  async initializeAIPoweredNotifications(userId: string): Promise<void> {
    try {
      await this.initialize();
      console.log('✅ AI-powered notifications initialized for user:', userId);
    } catch (error) {
      console.error('❌ Error initializing AI notifications:', error);
    }
  }

  async scheduleSpendingPatternAlert(userId: string, pattern: string, amount: number): Promise<void> {
    try {
      await this.initialize();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔍 Spending Pattern Detected',
          body: `You tend to overspend on ${pattern}. This month: ₨${Math.round(amount).toLocaleString()}.`,
          data: { userId, pattern, amount, type: 'spending_pattern' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'alerts' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error scheduling spending pattern alert:', error);
    }
  }

  async scheduleBudgetOptimizationTip(userId: string, tip: string): Promise<void> {
    try {
      await this.initialize();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💡 Budget Optimization Tip',
          body: tip,
          data: { userId, type: 'budget_tip' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'default' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error scheduling budget tip:', error);
    }
  }

  async scheduleSmartCategorySuggestion(userId: string, category: string, confidence: number): Promise<void> {
    try {
      await this.initialize();
      if (confidence < 0.7) return; // Only notify on high-confidence suggestions
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Smart Category Suggestion',
          body: `We suggest categorizing recent transactions as "${category}". Tap to review.`,
          data: { userId, category, confidence, type: 'category_suggestion' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'default' }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error scheduling category suggestion:', error);
    }
  }

  // ─── Cancel / query ────────────────────────────────────────────────────────
  async cancelNotification(key: string): Promise<void> {
    try {
      await this.cancelByKey(key);
      console.log('✅ Notification cancelled by key:', key);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const data = response.notification.request.content.data as any;
    console.log('🔔 Notification tapped:', data?.type, data);
  }
}

export default NotificationService.getInstance();
