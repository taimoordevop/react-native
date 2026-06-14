import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FutureNotificationItem {
  id: string;
  type: 'goal_due' | 'weekly_summary' | 'monthly_review' | 'savings_reminder' | 'ai_insights';
  title: string;
  message: string;
  scheduledFor: string;
  data?: any;
  isActive: boolean;
}

class FutureNotificationService {
  private static instance: FutureNotificationService;

  private constructor() {}

  static getInstance(): FutureNotificationService {
    if (!FutureNotificationService.instance) {
      FutureNotificationService.instance = new FutureNotificationService();
    }
    return FutureNotificationService.instance;
  }

  // ADD FUTURE NOTIFICATION (AsyncStorage + real OS notification)
  async addFutureNotification(userId: string, notification: Omit<FutureNotificationItem, 'id'>): Promise<void> {
    try {
      const newNotification: FutureNotificationItem = {
        ...notification,
        id: Date.now().toString(),
      };

      // Persist to AsyncStorage for in-app list
      const raw = await AsyncStorage.getItem(`future_notifications_${userId}`);
      const all: FutureNotificationItem[] = raw ? JSON.parse(raw) : [];
      all.push(newNotification);
      await AsyncStorage.setItem(`future_notifications_${userId}`, JSON.stringify(all));

      // Also schedule a real OS notification via expo-notifications
      const scheduledDate = new Date(notification.scheduledFor);
      const now = new Date();
      if (scheduledDate.getTime() > now.getTime() + 60000) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.message,
            data: { ...notification.data, type: notification.type },
            sound: 'default',
            ...(Platform.OS === 'android' && { channelId: 'reminders' }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduledDate,
          },
        });
      }

      console.log('✅ Future notification added + OS scheduled:', notification.title);
    } catch (error) {
      console.error('❌ Error adding future notification:', error);
    }
  }

  // GET FUTURE NOTIFICATIONS
  async getFutureNotifications(userId: string): Promise<FutureNotificationItem[]> {
    try {
      const storedNotifications = await AsyncStorage.getItem(`future_notifications_${userId}`);
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        // Filter out expired notifications
        const now = new Date();
        const activeNotifications = parsedNotifications.filter((notification: FutureNotificationItem) => {
          const scheduledDate = new Date(notification.scheduledFor);
          return scheduledDate > now && notification.isActive;
        });
        return activeNotifications;
      }
      return [];
    } catch (error) {
      console.error('❌ Error getting future notifications:', error);
      return [];
    }
  }

  // REMOVE FUTURE NOTIFICATION
  async removeFutureNotification(userId: string, notificationId: string): Promise<void> {
    try {
      const notifications = await this.getFutureNotifications(userId);
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem(`future_notifications_${userId}`, JSON.stringify(updatedNotifications));
      
      console.log('✅ Future notification removed:', notificationId);
    } catch (error) {
      console.error('❌ Error removing future notification:', error);
    }
  }

  // CHECK DUE NOTIFICATIONS (for notification screen)
  async checkDueNotifications(userId: string): Promise<FutureNotificationItem[]> {
    try {
      const notifications = await this.getFutureNotifications(userId);
      const now = new Date();
      const dueNotifications = notifications.filter(notification => {
        const scheduledDate = new Date(notification.scheduledFor);
        return scheduledDate <= now && notification.isActive;
      });

      return dueNotifications;
    } catch (error) {
      console.error('❌ Error checking due notifications:', error);
      return [];
    }
  }

  // GOAL DUE REMINDERS (Future Scheduled)
  async scheduleGoalDueDateReminder(userId: string, goalId: string, goalName: string, dueDate: Date, dueTime: string): Promise<void> {
    try {
      // Parse the due time (format: "HH:MM:SS" or "HH:MM")
      const timeParts = dueTime.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

      // Create the exact due date and time
      const dueDateTime = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
        hours,
        minutes,
        seconds
      );

      const now = new Date();
      const timeUntilDue = dueDateTime.getTime() - now.getTime();

      console.log('🔔 Scheduling goal reminder (future):', {
        goalName,
        dueDateTime: dueDateTime.toISOString(),
        timeUntilDueHours: Math.round(timeUntilDue / (1000 * 60 * 60))
      });

      // Only schedule if due date is more than 1 minute in the future
      if (timeUntilDue <= 60000) {
        console.log('❌ Skipping notification - due date too soon or passed');
        return;
      }

      // Add to in-app list AND schedule real OS notification
      await this.addFutureNotification(userId, {
        type: 'goal_due',
        title: '🎯 Goal Due Now!',
        message: `It's time for your goal "${goalName}"! Check your achievement.`,
        scheduledFor: dueDateTime.toISOString(),
        data: { goalId, goalName },
        isActive: true,
      });

      // Also schedule a 1-day reminder if the goal is more than 1 day away
      const oneDayBefore = new Date(dueDateTime);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      
      if (oneDayBefore.getTime() > now.getTime()) {
        await this.addFutureNotification(userId, {
          type: 'goal_due',
          title: '⏰ Goal Reminder',
          message: `Your goal "${goalName}" is due tomorrow!`,
          scheduledFor: oneDayBefore.toISOString(),
          data: { goalId, goalName },
          isActive: true,
        });
        console.log('✅ 1-day reminder scheduled for goal:', goalName);
      }

      console.log('✅ Goal reminder scheduled for future notification screen:', dueDateTime.toLocaleString());
    } catch (error) {
      console.error('❌ Error scheduling goal reminder:', error);
    }
  }

  // INITIALIZE FUTURE NOTIFICATIONS
  async initializeFutureNotifications(userId: string): Promise<void> {
    try {
      console.log('🔄 Initializing future notifications for user:', userId);
      
      // Note: We don't check for existing AsyncStorage entries because those are just for the 
      // in-app notification list UI. OS notifications need to be scheduled independently.
      // The NotificationService handles duplicate prevention via its own logic.

      const now = new Date();

      // Schedule weekly spending summary (every Sunday at 9 PM)
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
      nextSunday.setHours(21, 0, 0, 0); // 9:00 PM

      if (now.getDay() === 0 && now.getHours() >= 21) {
        nextSunday.setDate(nextSunday.getDate() + 7);
      }

      await this.addFutureNotification(userId, {
        type: 'weekly_summary',
        title: '📊 Weekly Spending Summary',
        message: 'Your weekly spending report is ready! Check your spending patterns and stay on track.',
        scheduledFor: nextSunday.toISOString(),
        isActive: true,
      });

      // Schedule monthly budget review (1st of every month at 10 AM)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 10, 0, 0);
      await this.addFutureNotification(userId, {
        type: 'monthly_review',
        title: '📈 Monthly Budget Review',
        message: 'Time to review your monthly budget! See how you performed and plan for next month.',
        scheduledFor: nextMonth.toISOString(),
        isActive: true,
      });

      // Schedule savings goal reminders (every Wednesday at 8 PM)
      const nextWednesday = new Date(now);
      nextWednesday.setDate(now.getDate() + ((3 + 7 - now.getDay()) % 7)); // Next Wednesday
      nextWednesday.setHours(20, 0, 0, 0); // 8:00 PM

      if (now.getDay() === 3 && now.getHours() >= 20) {
        nextWednesday.setDate(nextWednesday.getDate() + 7);
      }

      await this.addFutureNotification(userId, {
        type: 'savings_reminder',
        title: '💰 Savings Goal Reminder',
        message: 'Don\'t forget to contribute to your savings goals this week! Every little bit counts.',
        scheduledFor: nextWednesday.toISOString(),
        isActive: true,
      });

      // Schedule AI insights (every 3 days at 6 PM)
      const nextAIInsight = new Date(now);
      nextAIInsight.setDate(now.getDate() + 3);
      nextAIInsight.setHours(18, 0, 0, 0); // 6:00 PM

      await this.addFutureNotification(userId, {
        type: 'ai_insights',
        title: '🤖 AI Financial Insights',
        message: 'Your personalized AI insights are ready! Discover spending patterns and optimization tips.',
        scheduledFor: nextAIInsight.toISOString(),
        isActive: true,
      });

      console.log('✅ All future notifications initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing future notifications:', error);
    }
  }
}

export default FutureNotificationService; 