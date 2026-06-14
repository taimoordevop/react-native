import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './supabase';
import { AuthContext } from './_layout';
import NotificationService from './services/NotificationService';

export default function AddTransactionScreen() {
  const { userId } = useContext(AuthContext);
  const params = useLocalSearchParams();
  const isEditMode = params.mode === 'edit';
  const transactionId = params.transactionId as string;
  
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>(
    isEditMode ? (params.transactionType as 'expense' | 'income') : 'expense'
  );
  const [amount, setAmount] = useState(isEditMode ? (params.amount as string) : '');
  const [description, setDescription] = useState(isEditMode ? (params.description as string) : '');
  const [notes, setNotes] = useState(isEditMode ? (params.notes as string) : '');
  const [category, setCategory] = useState(isEditMode ? (params.category as string) : '');
  const [date, setDate] = useState(isEditMode ? new Date(params.date as string) : new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSelectedCategory, setAiSelectedCategory] = useState<string | null>(null);
  const router = useRouter();

  // Fetch categories from Supabase
  const fetchCategories = React.useCallback(async () => {
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
        // Only set default category if not in edit mode
        if (!isEditMode) {
          setCategory(data[0].name);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [isEditMode, setCategory]);

  // Fetch categories from Supabase
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // AI Suggestion Logic - Navigate to AI screen when both amount and description are entered
  useEffect(() => {
    if (transactionType === 'expense' && description && amount) {
      const amountValue = parseFloat(amount);
      if (!isNaN(amountValue) && amountValue > 0) {
        // Only show AI suggestion if not in edit mode (new transaction)
        const shouldShowAI = !isEditMode;
        
        if (shouldShowAI) {
          // Add a small delay to avoid navigating immediately while typing
          const timer = setTimeout(() => {
            // Navigate to AI suggestion screen
            router.push({
              pathname: '/ai_suggestion',
              params: {
                description: description,
                amount: amount,
                notes: notes || '',
                transactionType: transactionType
              }
            });
          }, 1500); // 1.5 second delay

          return () => clearTimeout(timer);
        }
      }
    }
  }, [description, amount, transactionType, isEditMode, router]); // eslint-disable-line react-hooks/exhaustive-deps
  // AI should only trigger on description, not notes (intentionally excluding notes from deps)

  // Check for AI selected category when returning from AI suggestion screen
  useEffect(() => {
    const checkForAICategory = () => {
      if ((global as any).selectedAICategory && (global as any).selectedAICategoryTimestamp) {
        const timestamp = (global as any).selectedAICategoryTimestamp;
        const now = Date.now();
        
        // Only use the category if it's fresh (within last 5 seconds)
        if (now - timestamp < 5000) {
          setCategory((global as any).selectedAICategory);
          setAiSelectedCategory((global as any).selectedAICategory);
          console.log('AI Category selected:', (global as any).selectedAICategory);
          
          // Clear the AI selection indicator after 3 seconds
          setTimeout(() => {
            setAiSelectedCategory(null);
          }, 3000);
        }
        
        // Clear the global variables
        (global as any).selectedAICategory = null;
        (global as any).selectedAICategoryTimestamp = null;
      }
    };

    // Check immediately
    checkForAICategory();
    
    // Also check periodically to catch when user returns from AI screen
    const interval = setInterval(checkForAICategory, 500);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleSave = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (transactionType === 'expense' && !category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    // Notes validation removed - notes are optional
    // if (!notes.trim()) {
    //   Alert.alert('Error', 'Please add notes');
    //   return;
    // }

    try {
      // Get current user
      if (!userId) {
        Alert.alert('Error', 'Please log in to save transactions');
        return;
      }

      // For income transactions, use "Income" category
      let categoryId = null;
      if (transactionType === 'expense') {
        // Find the selected category
        const selectedCategory = categories.find(cat => cat.name === category);
        if (selectedCategory) {
          categoryId = selectedCategory.id;
        }
      } else {
        // For income, find or create "Income" category
        let { data: incomeCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', 'Income')
          .single();
        
        if (!incomeCategory) {
          // Create Income category if it doesn't exist
          const { data: newIncomeCategory } = await supabase
            .from('categories')
            .insert([{ name: 'Income' }])
            .select('id')
            .single();
          incomeCategory = newIncomeCategory;
        }
        
        if (incomeCategory) {
          categoryId = incomeCategory.id;
        }
      }

      // Check if this is a goal transaction (expense with "Goals" category)
      const isGoalTransaction = transactionType === 'expense' && category === 'Goals';
      let oldAmount = 0;
      
      console.log('Transaction details:', {
        isEditMode,
        isGoalTransaction,
        transactionType,
        category,
        description,
        amount
      });
      
      // If editing a goal transaction, get the old amount
      if (isEditMode && isGoalTransaction) {
        const { data: oldTransaction } = await supabase
          .from('transactions')
          .select('amount')
          .eq('id', transactionId)
          .single();
        
        if (oldTransaction) {
          oldAmount = Math.abs(oldTransaction.amount); // Convert negative to positive
          console.log('Old transaction amount:', oldAmount);
        }
      }

      // Prepare transaction data
      const transactionData = {
        user_id: userId,
        amount: transactionType === 'expense' ? -parseFloat(amount) : parseFloat(amount), // Negative for expenses, positive for income
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, // Fixed: Timezone-safe date formatting
        category_id: categoryId,
        description: description.trim(),
        notes: notes.trim() || null,
      };

      let result;
      if (isEditMode) {
        // Update existing transaction
        result = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transactionId)
          .eq('user_id', userId)
          .select();
      } else {
        // Insert new transaction
        result = await supabase
          .from('transactions')
          .insert([transactionData])
          .select();
      }

      if (result.error) {
        console.error('Error saving transaction:', result.error);
        Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'save'} transaction. Please try again.`);
        return;
      }

      // If this is a goal transaction, update the goal's current_amount
      if (isGoalTransaction) {
        const newAmount = parseFloat(amount);
        let goalUpdateAmount = 0;

        if (isEditMode) {
          // For editing: calculate the difference and update goal
          goalUpdateAmount = newAmount - oldAmount;
          console.log('Goal transaction edit:', {
            newAmount,
            oldAmount,
            goalUpdateAmount
          });
        } else {
          // For new goal transaction: add the full amount
          goalUpdateAmount = newAmount;
          console.log('New goal transaction:', {
            newAmount,
            goalUpdateAmount
          });
        }

        if (goalUpdateAmount !== 0) {
          // Extract goal name from transaction description
          // Goal transactions have format: "Goal: {goalName}"
          let goalName = description.trim();
          if (goalName.startsWith('Goal: ')) {
            goalName = goalName.substring(6); // Remove "Goal: " prefix
          }

          console.log('Looking for goal with name:', goalName);

          // Find the goal that matches this transaction description
          const { data: goal } = await supabase
            .from('goals')
            .select('id, current_amount')
            .eq('user_id', userId)
            .eq('name', goalName)
            .single();

          if (goal) {
            // Update the goal's current_amount
            const newCurrentAmount = goal.current_amount + goalUpdateAmount;
            console.log('Updating goal:', {
              goalId: goal.id,
              currentAmount: goal.current_amount,
              goalUpdateAmount,
              newCurrentAmount
            });

            const { error: goalError } = await supabase
              .from('goals')
              .update({ current_amount: newCurrentAmount })
              .eq('id', goal.id)
              .eq('user_id', userId);

            if (goalError) {
              console.error('Error updating goal:', goalError);
              // Don't show error to user as transaction was saved successfully
            } else {
              console.log(`Goal "${goalName}" updated: ${goal.current_amount} + ${goalUpdateAmount} = ${newCurrentAmount}`);
            }
          } else {
            console.log(`Goal not found for name: "${goalName}"`);
          }
        } else {
          console.log('No goal update needed (amount difference is 0)');
        }
      }

      // Check for financial alerts
      if (transactionType === 'expense') {
        const transactionAmount = parseFloat(amount);
        
        // Fire unusual transaction alert if amount is significantly high
        if (transactionAmount > 10000) {
          await NotificationService.scheduleUnusualTransactionAlert(transactionAmount, description.trim());
        }
          
                  // Check for overspending based on category budget limits (exclude Income)
        if (category !== 'Income') {
          try {
            const { data: categoryLimits, error: limitsError } = await supabase
              .from('category_budget_limits')
              .select('*')
              .eq('user_id', userId)
              .eq('category_name', category)
              .eq('is_active', true)
              .single();

            if (!limitsError && categoryLimits) {
              // Get current month's spending for this category
              const currentMonth = new Date();
              const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
              const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

              const { data: monthlySpending, error: spendingError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', userId)
                .eq('category_id', categoryId)
                .gte('date', startOfMonth.toISOString().split('T')[0])
                .lte('date', endOfMonth.toISOString().split('T')[0])
                .eq('is_deleted', false);

              if (!spendingError && monthlySpending) {
                const totalSpent = monthlySpending.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
                const newTotalSpent = totalSpent + Math.abs(transactionAmount);

                // Check if budget limit is reached or exceeded
                if (newTotalSpent >= categoryLimits.monthly_limit) {
                  await NotificationService.scheduleOverspendingAlert(
                    category,
                    newTotalSpent,
                    categoryLimits.monthly_limit
                  );
                }
              }
            }
          } catch (error) {
            console.log('Error checking budget limits:', error);
          }
        }
      }

      // Success
      Alert.alert(
        'Success',
        `Transaction ${isEditMode ? 'updated' : 'saved'} successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form and go back
              if (!isEditMode) {
                // clearForm(); // Removed clearForm as it's not defined in this version
              }
              router.back();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const clearForm = () => {
    setAmount('');
    setDescription('');
    setNotes('');
    setDate(new Date());
  };

  const handleExpenseToggle = () => {
    setTransactionType('expense');
    clearForm();
  };

  const handleIncomeToggle = () => {
    setTransactionType('income');
    clearForm();
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
      const isSelected = date.getDate() === day && 
                        date.getMonth() === month && 
                        date.getFullYear() === year;
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
            setDate(currentDate);
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

    // Category emojis mapping
    const categoryEmojis: { [key: string]: string } = {
      'Food': '🍕',
      'Water': '💧',
      'Gas': '⛽',
      'Transport': '🚗',
      'Education': '📚',
      'Extra': '📝'
    };

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={false}
          keyboardDismissMode="on-drag"
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>⟵</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{isEditMode ? 'Edit Transaction' : 'Add Transaction'}</Text>
            <Text style={styles.subtitle}>{isEditMode ? 'Update your transaction details' : 'Record your income or expense'}</Text>
          </View>
        </View>

        {/* Transaction Type Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              transactionType === 'expense' && styles.toggleButtonActive,
              transactionType === 'expense' && styles.expenseButton
            ]}
            onPress={handleExpenseToggle}
          >
            <Text style={[
              styles.toggleButtonText,
              transactionType === 'expense' && styles.toggleButtonTextActive
            ]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              transactionType === 'income' && styles.toggleButtonActive,
              transactionType === 'income' && styles.incomeButton
            ]}
            onPress={handleIncomeToggle}
          >
            <Text style={[
              styles.toggleButtonText,
              transactionType === 'income' && styles.toggleButtonTextActive
            ]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder={transactionType === 'income' ? "e.g., Salary, Freelance" : "e.g., Groceries"}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        {/* Category - Only show for Expense */}
        {transactionType === 'expense' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            
            {/* AI Selection Indicator */}
            {aiSelectedCategory && (
              <View style={styles.aiSelectionIndicator}>
                <Text style={styles.aiSelectionText}>
                  🤖 AI selected: {aiSelectedCategory}
                </Text>
              </View>
            )}
            
            {renderCategories()}
          </View>
        )}

        {/* Date - Show for both Expense and Income */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDateModal(true)}
          >
            <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
            <Text style={styles.dateButtonIcon}>📅</Text>
          </TouchableOpacity>
        </View>



        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder={transactionType === 'income' ? "e.g., Monthly salary, Bonus payment" : "Add any additional notes"}
            returnKeyType="done"
            blurOnSubmit={true}
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
            enablesReturnKeyAutomatically={false}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[
            styles.saveButton,
            transactionType === 'income' && styles.saveIncomeButton
          ]} 
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            {isEditMode ? 'Update Transaction' : `Save ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
          </Text>
        </TouchableOpacity>
        </ScrollView>

        {/* Calendar Modal */}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    paddingTop: 10,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  backText: {
    fontSize: 30,
    color: '#222',
    fontWeight: 'bold',
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 30,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  expenseButton: {
    backgroundColor: '#ff4444',
  },
  incomeButton: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
  },
  notesInput: {
    minHeight: 80,
    maxHeight: 120,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    paddingBottom: 25, // Added extra bottom padding for better centering
    marginHorizontal: 5,
    alignItems: 'center',
    height: 80, // Increased height for better appearance
  },
  categoryCardActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f00',
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
    backgroundColor: '#ff4444',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveIncomeButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  aiSelectionIndicator: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiSelectionText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
}); 