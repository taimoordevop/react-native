import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabase';
import { AuthContext } from './_layout';

export default function EditGoalScreen() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  const params = useLocalSearchParams();
  
  const [goalName, setGoalName] = useState('');
  const [category, setCategory] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [selectedIcon, setSelectedIcon] = useState('flag');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const goalId = params.goalId as string;

  // Category emojis mapping
  const categoryEmojis: { [key: string]: string } = {
    'Food': '🍕', 'Water': '💧', 'Gas': '⛽', 'Transport': '🚗', 'Education': '📚',
    'Extra': '📦', 'Savings': '💰', 'Transportation': '🚗', 'Housing': '🏠',
    'Entertainment': '🎮', 'Health': '🏥', 'Travel': '✈️', 'Business': '💼'
  };

  // Fetch categories and goal data
  useEffect(() => {
    fetchCategories();
    if (goalId) {
      fetchGoalData();
    }
  }, [goalId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        Alert.alert('Error', 'Failed to load categories');
      } else if (data && data.length > 0) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchGoalData = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching goal:', error);
        Alert.alert('Error', 'Failed to load goal data');
        router.back();
        return;
      }

      if (data) {
        setGoalName(data.name);
        setCategory(data.category);
        setTargetAmount(data.target_amount.toString());
        setDueDate(new Date(data.due_date));
        setSelectedIcon(data.icon || 'flag');
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to load goal data');
      router.back();
    }
  };

  const handleSave = async () => {
    // Validation
    if (!goalName.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    try {
      setSaving(true);

      // Update goal in database
                  const { error } = await supabase
              .from('goals')
              .update({
                name: goalName.trim(),
                category: category,
                target_amount: parseFloat(targetAmount),
                due_date: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`, // Fixed: Timezone-safe date formatting
                icon: selectedIcon,
              })
              .eq('id', goalId)
              .eq('user_id', userId);

      if (error) {
        console.error('Error updating goal:', error);
        Alert.alert('Error', 'Failed to update goal. Please try again.');
        return;
      }

      // Success
      Alert.alert(
        'Success',
        'Goal updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isSelected = dueDate.getDate() === day &&
                        dueDate.getMonth() === month &&
                        dueDate.getFullYear() === year;
      const isToday = new Date().toDateString() === currentDate.toDateString();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isToday && styles.today
          ]}
          onPress={() => {
            setDueDate(currentDate);
            setShowDateModal(false);
          }}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isToday && styles.todayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const renderCategories = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      );
    }

    if (categories.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No categories available</Text>
        </View>
      );
    }

    const rows = [];
    for (let i = 0; i < categories.length; i += 2) {
      const row = (
        <View key={i} style={styles.categoryRow}>
          <TouchableOpacity
            style={[
              styles.categoryCard,
              category === categories[i].name && styles.categoryCardActive
            ]}
            onPress={() => setCategory(categories[i].name)}
          >
            <Text style={styles.categoryEmoji}>
              {categoryEmojis[categories[i].name] || '📋'}
            </Text>
            <Text style={[
              styles.categoryText,
              category === categories[i].name && styles.categoryTextActive
            ]}>
              {categories[i].name}
            </Text>
          </TouchableOpacity>

          {categories[i + 1] && (
            <TouchableOpacity
              style={[
                styles.categoryCard,
                category === categories[i + 1].name && styles.categoryCardActive
              ]}
              onPress={() => setCategory(categories[i + 1].name)}
            >
              <Text style={styles.categoryEmoji}>
                {categoryEmojis[categories[i + 1].name] || '📋'}
              </Text>
              <Text style={[
                styles.categoryText,
                category === categories[i + 1].name && styles.categoryTextActive
              ]}>
                {categories[i + 1].name}
              </Text>
            </TouchableOpacity>
          )}

          {!categories[i + 1] && <View style={styles.categoryCard} />}
        </View>
      );
      rows.push(row);
    }

    return rows;
  };

  const icons = [
    { name: 'flag', color: '#6366f1' }, { name: 'car', color: '#ff9800' },
    { name: 'school', color: '#2196f3' }, { name: 'home', color: '#4caf50' },
    { name: 'game-controller', color: '#9c27b0' }, { name: 'medical', color: '#f44336' },
    { name: 'airplane', color: '#00bcd4' }, { name: 'briefcase', color: '#795548' },
    { name: 'heart', color: '#e91e63' }, { name: 'star', color: '#ffc107' },
    { name: 'gift', color: '#ff5722' }, { name: 'diamond', color: '#607d8b' }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#636e72" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Edit Goal</Text>
          <Text style={styles.subtitle}>Update your financial objective</Text>
        </View>
      </View>

      {/* Form Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        bounces={false}
      >
        <View style={styles.formContainer}>
          {/* Goal Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Name</Text>
            <TextInput
              style={styles.input}
              value={goalName}
              onChangeText={setGoalName}
              placeholder="e.g., Emergency Fund"
              placeholderTextColor="#b2bec3"
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {renderCategories()}
            </View>
          </View>

          {/* Target Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Amount</Text>
            <TextInput
              style={styles.input}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#b2bec3"
            />
          </View>

          {/* Due Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDateModal(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(dueDate)}</Text>
              <Text style={styles.dateButtonIcon}>📅</Text>
            </TouchableOpacity>
          </View>

          {/* Icon Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Choose Icon</Text>
            <View style={styles.iconGrid}>
              {icons.map((icon) => (
                <TouchableOpacity
                  key={icon.name}
                  style={[
                    styles.iconCard,
                    selectedIcon === icon.name && styles.iconCardActive
                  ]}
                  onPress={() => setSelectedIcon(icon.name)}
                >
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: icon.color },
                    selectedIcon === icon.name && styles.iconContainerActive
                  ]}>
                    <Ionicons
                      name={icon.name as any}
                      size={24}
                      color="#fff"
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Update Goal</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Text style={styles.monthButton}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {getMonthName(currentMonth.getMonth())} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Text style={styles.monthButton}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {renderCalendar()}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    flex: 1,
    padding: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 50,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '48%',
    alignItems: 'center',
  },
  categoryCardActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconCard: {
    alignItems: 'center',
    padding: 8,
  },
  iconCardActive: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 18,
    color: '#333',
  },
  dateButtonIcon: {
    fontSize: 24,
    color: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#a5a5a5',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    fontSize: 24,
    color: '#007AFF',
    padding: 10,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  today: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 20,
  },
  todayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalCancelButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});