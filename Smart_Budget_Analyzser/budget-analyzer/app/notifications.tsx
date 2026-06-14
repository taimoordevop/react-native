import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useFocusEffect } from 'expo-router';
import FutureNotificationService, { FutureNotificationItem } from './services/FutureNotificationService';
import { AuthContext } from './_layout';



export default function NotificationsScreen() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<FutureNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load notifications using future notification service
  const loadNotifications = async () => {
    try {
      const futureService = FutureNotificationService.getInstance();
      const storedNotifications = await futureService.getFutureNotifications(userId);
      setNotifications(storedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Remove a notification
  const removeNotification = async (id: string) => {
    try {
      const futureService = FutureNotificationService.getInstance();
      await futureService.removeFutureNotification(userId, id);
      await loadNotifications(); // Reload the list
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  // Initialize notifications for the user
  const initializeUserNotifications = async () => {
    try {
      const futureService = FutureNotificationService.getInstance();
      await futureService.initializeFutureNotifications(userId);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  // Check for due notifications and trigger them
  const checkDueNotifications = async () => {
    try {
      const futureService = FutureNotificationService.getInstance();
      const dueNotifications = await futureService.checkDueNotifications(userId);
      // Due notifications will appear in the notification screen
      await loadNotifications(); // Reload the list after checking
    } catch (error) {
      console.error('Error checking due notifications:', error);
    }
  };

  // Load notifications on focus
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
      checkDueNotifications();
    }, [])
  );

  // Initialize notifications on first load
  useEffect(() => {
    const initializeNotifications = async () => {
      setLoading(true);
      await loadNotifications();
      
      // If no notifications exist, initialize them
      if (notifications.length === 0) {
        await initializeUserNotifications();
      }
      
      setLoading(false);
    };

    initializeNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await checkDueNotifications();
    setRefreshing(false);
  };

  const formatScheduledTime = (scheduledFor: string) => {
    const date = new Date(scheduledFor);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffDays > 1) {
      return `${diffDays} days from now`;
    } else if (diffHours > 1) {
      return `${diffHours} hours from now`;
    } else {
      return 'Less than an hour from now';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'goal_due':
        return '🎯';
      case 'weekly_summary':
        return '📊';
      case 'monthly_review':
        return '📈';
      case 'savings_reminder':
        return '💰';
      case 'ai_insights':
        return '🤖';
      default:
        return '📢';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f8cff" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f8cff']} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Scheduled Notifications</Text>
            <Text style={styles.emptySubtitle}>
              Your future notifications will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <View key={notification.id} style={styles.notificationCard}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </Text>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationTime}>
                      {formatScheduledTime(notification.scheduledFor)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeNotification(notification.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={20} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#636e72',
    fontSize: 16,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40, // Add extra bottom padding to ensure last card is visible
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#636e72',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 8,
    textAlign: 'center',
  },
  notificationsList: {
    gap: 16,
    paddingBottom: 20, // Add bottom padding to the list
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#718096',
  },
  removeButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
}); 