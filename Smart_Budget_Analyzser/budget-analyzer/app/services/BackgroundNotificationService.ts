import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

// Background task: fires any OS notifications that are overdue
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('🔄 Background notification task running');
    // expo-notifications handles its own scheduling — no extra action needed here.
    // This task keeps the app registered for background wakeups so the OS
    // can deliver scheduled notifications even when the app is terminated.
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 ${scheduled.length} notification(s) still scheduled`);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('❌ Background notification task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export class BackgroundNotificationService {
  static async registerBackgroundTask(): Promise<void> {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('✅ Background notification task registered');
    } catch (error) {
      console.error('❌ Error registering background task:', error);
    }
  }
  
  static async unregisterBackgroundTask(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('✅ Background notification task unregistered');
    } catch (error) {
      console.error('❌ Error unregistering background task:', error);
    }
  }
} 