import React, { useState, useContext, createContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { supabase } from '../supabase';
import { AuthContext } from '../_layout';
import { CurrencyContext } from '../_layout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  category?: { name: string } | string;
};

export const BudgetContext = createContext<{
  budgets: Budget[];
  addBudget: (categoryId: string, amount: number, customCategory?: string) => void;
  updateBudget: (budgetId: string, newAmount: number) => void;
}>(
  {
    budgets: [],
    addBudget: () => {},
    updateBudget: () => {},
  }
);

export function BudgetContextProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useContext(AuthContext);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    const fetchBudgets = async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, category:categories(name)')
        .eq('user_id', userId)
        .order('id', { ascending: false });
      if (!error && data) {
        setBudgets(data);
      }
    };
    if (userId) fetchBudgets();
  }, [userId]);

  const addBudget = async (categoryId: string, amount: number, customCategory?: string) => {
    let catId = categoryId;
    if (customCategory) {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ user_id: userId, name: customCategory }])
        .select();
      if (!error && data && data.length > 0) {
        catId = data[0].id;
      } else {
        Alert.alert('Error adding custom category', error?.message || 'Unknown error');
        return;
      }
    }
    if (!catId || !amount) return;
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = nextMonth.toISOString().slice(0, 10);
    
    const { data, error } = await supabase
      .from('budgets')
      .insert([{ user_id: userId, category_id: catId, amount, start_date: today, end_date: endDate }])
      .select('*, category:categories(name)');
    
    if (error || !data || data.length === 0) {
      Alert.alert('Error adding budget', error?.message || 'No data returned');
    }
    if (!error && data && data.length > 0) {
      setBudgets([data[0], ...budgets]);
    }
  };

  const updateBudget = async (budgetId: string, newAmount: number) => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('budgets')
      .update({ amount: newAmount, updated_at: now })
      .eq('id', budgetId)
      .eq('user_id', userId)
      .select('*, category:categories(name)');
    
    if (error) {
      Alert.alert('Error updating budget', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      setBudgets(prev => prev.map(b => b.id === budgetId ? data[0] : b));
    }
  };

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, updateBudget }}>
      {children}
    </BudgetContext.Provider>
  );
}

export default function BudgetScreen() {
  const { userId } = useContext(AuthContext);
  const { currency, getCurrencySymbol } = useContext(CurrencyContext);
  const router = useRouter();
  const [goals, setGoals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGoals, setTotalGoals] = useState(0);
  const [completedGoals, setCompletedGoals] = useState(0);
  const [onTrackGoals, setOnTrackGoals] = useState(0);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [currentMonthGoalTarget, setCurrentMonthGoalTarget] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  // Month filter state
  const [selectedMonth, setSelectedMonth] = useState<string>('All Months');
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [filteredGoals, setFilteredGoals] = useState<any[]>([]);

  // Generate month options
  const getMonthOptions = () => {
    const months = ['All Months'];
    const currentDate = new Date();
    
    // Add current year months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), i, 1);
      months.push(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    }
    
    // Add previous year months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear() - 1, i, 1);
      months.push(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    }
    
    return months;
  };

  // Filter goals by selected month
  const filterGoalsByMonth = (goals: any[], month: string) => {
    if (month === 'All Months') {
      return goals;
    }
    
    return goals.filter(goal => {
      // Use due_date for filtering (this stores the month when goal was created)
      const goalDate = new Date(goal.due_date);
      const goalMonth = goalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return goalMonth === month;
    });
  };

  // Fetch goals and transactions from database
  useEffect(() => {
    fetchGoals();
    fetchTransactions();
  }, [userId]);

  // Refresh goals when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchGoals();
      fetchTransactions();
    }, [userId])
  );

  // Update filtered goals when goals or selected month changes
  useEffect(() => {
    setFilteredGoals(filterGoalsByMonth(goals, selectedMonth));
  }, [goals, selectedMonth]);

  const fetchTransactions = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      if (data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchGoals = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error);
        return;
      }

      if (data) {
        setGoals(data);
        
        // Calculate summary statistics for ALL goals (not filtered)
        const total = data.length;
        const completed = data.filter(goal => goal.current_amount >= goal.target_amount).length;
        const onTrack = data.filter(goal => {
          const progress = goal.current_amount / goal.target_amount;
          const daysUntilDue = Math.ceil((new Date(goal.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const expectedProgress = 1 - (daysUntilDue / 365); // Assume 1 year timeline
          return progress >= expectedProgress && goal.current_amount < goal.target_amount;
        }).length;
        
        const totalCurrent = data.reduce((sum, goal) => sum + parseFloat(goal.current_amount || 0), 0);
        const totalTarget = data.reduce((sum, goal) => sum + parseFloat(goal.target_amount || 0), 0);
        
        setTotalGoals(total);
        setCompletedGoals(completed);
        setOnTrackGoals(onTrack);
        setTotalTarget(totalTarget);
        
        // Calculate REAL savings (Income - Expenses)
        const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const realSavings = totalIncome - totalExpenses;
        
        setCurrentSavings(realSavings);
        
        // Calculate progress percentage based on real savings vs total goal target
        const percentage = totalTarget > 0 ? Math.round((realSavings / totalTarget) * 100) : 0;
        setProgressPercentage(percentage);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage when transactions or goals change
  useEffect(() => {
    // Calculate current month savings only
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });
    
    const currentMonthIncome = currentMonthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const currentMonthExpenses = currentMonthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const currentMonthSavings = currentMonthIncome - currentMonthExpenses;
    
    setCurrentSavings(currentMonthSavings);
    
    // Set a realistic monthly savings target (you can adjust this value)
    const monthlySavingsTarget = 5000; // Rs 5,000 monthly savings target
    setCurrentMonthGoalTarget(monthlySavingsTarget);
    
    // Calculate percentage based on current month savings vs monthly savings target
    const percentage = monthlySavingsTarget > 0 ? Math.min(Math.round((currentMonthSavings / monthlySavingsTarget) * 100), 100) : 0;
    setProgressPercentage(percentage);
    
    // Debug logging
    console.log('Current Month Savings:', currentMonthSavings);
    console.log('Monthly Savings Target:', monthlySavingsTarget);
    console.log('Calculated Percentage:', percentage);
  }, [transactions, goals, totalTarget]);

  const handleNewGoal = () => {
    router.push('/add_goal');
  };

  const handleAddMoney = (goal: any) => {
    router.push({
      pathname: '/add_money',
      params: {
        goalId: goal.id,
        goalName: goal.name,
        currentAmount: goal.current_amount.toString(),
        targetAmount: goal.target_amount.toString(),
        dueDate: goal.due_date,
        goalIcon: goal.icon
      }
    });
  };

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setShowMonthModal(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Budget & Goals</Text>
          <Text style={styles.headerSubtitle}>Track your financial objectives</Text>
        </View>
        <TouchableOpacity style={styles.newGoalButton} onPress={handleNewGoal}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newGoalButtonText}>New Goal</Text>
        </TouchableOpacity>
      </View>

      {/* Info Cards Row */}
      <View style={styles.infoCardsRow}>
        {/* Total Goals Card */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['#e3f2fd', '#ffffff']}
            style={styles.infoCardGradient}
          >
            <View style={styles.infoCardHeader}>
              <Ionicons name="flag" size={20} color="#1976d2" />
              <Text style={styles.infoCardTitle}>Total Goals</Text>
            </View>
            <Text style={styles.infoCardNumber}>{totalGoals}</Text>
            <Text style={styles.infoCardSubtext}>{onTrackGoals} on track</Text>
          </LinearGradient>
        </View>

        {/* Completed Card */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['#e8f5e8', '#ffffff']}
            style={styles.infoCardGradient}
          >
            <View style={styles.infoCardHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#388e3c" />
              <Text style={styles.infoCardTitle}>Completed</Text>
            </View>
            <Text style={styles.infoCardNumber}>{completedGoals}</Text>
            <Text style={styles.infoCardSubtext}>This year</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Combined Savings Progress Card */}
      <View style={styles.progressCard}>
        <LinearGradient
          colors={['#f3e5f5', '#ffffff']}
          style={styles.progressCardGradient}
        >
          <View style={styles.progressCardHeader}>
            <Text style={styles.progressCardTitle}>This Month's Savings</Text>
            <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
          </View>
          
          <Text style={styles.progressAmount}>
            {getCurrencySymbol(currency)}{currentSavings.toLocaleString()}
          </Text>
          
          <Text style={styles.progressTarget}>
            of {getCurrencySymbol(currency)}{currentMonthGoalTarget.toLocaleString()} this month's goal target
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.min(progressPercentage, 100)}%` }
                ]} 
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Your Goals Section */}
      <View style={styles.goalsSection}>
        <View style={styles.goalsSectionHeader}>
          <Text style={styles.goalsSectionTitle}>Your Goals</Text>
          <TouchableOpacity 
            style={styles.monthSelector} 
            onPress={() => setShowMonthModal(true)}
          >
            <Text style={styles.monthSelectorText}>{selectedMonth}</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading goals...</Text>
          </View>
        ) : filteredGoals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedMonth === 'All Months' 
                ? 'No goals yet. Create your first goal!' 
                : `No goals found for ${selectedMonth}. Try selecting a different month or create a new goal!`
              }
            </Text>
          </View>
        ) : (
          filteredGoals.map((goal) => {
            const progress = goal.current_amount / goal.target_amount;
            const progressPercentage = Math.round(progress * 100);
            const isCompleted = goal.current_amount >= goal.target_amount;
            
            // Determine goal status
            let status = 'Pending';
            let statusColor = '#f59e0b';
            let statusBgColor = '#fef3c7';
            
            if (isCompleted) {
              status = 'Completed';
              statusColor = '#10b981';
              statusBgColor = '#d1fae5';
            } else if (progress >= 0.5) {
              status = 'On Track';
              statusColor = '#3b82f6';
              statusBgColor = '#dbeafe';
            }
            
          return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalCardHeader}>
                  <View style={styles.goalInfo}>
                    <View style={[styles.goalIconContainer, { backgroundColor: isCompleted ? '#10b981' : '#6366f1' }]}>
                      <Ionicons name={goal.icon as any} size={20} color="#fff" />
                    </View>
                    <View style={styles.goalTextContainer}>
                      <Text style={styles.goalTitle}>{goal.name}</Text>
                      <Text style={styles.goalSubtitle}>{goal.category}</Text>
                    </View>
                  </View>
                  
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>{status}</Text>
                  </View>
                </View>
                
                <View style={styles.goalProgressSection}>
                  <View style={styles.goalProgressHeader}>
                    <Text style={styles.goalProgressLabel}>Progress</Text>
                    <Text style={styles.goalProgressAmount}>
                      {getCurrencySymbol(currency)}{goal.current_amount.toLocaleString()} / {getCurrencySymbol(currency)}{goal.target_amount.toLocaleString()}
                </Text>
                  </View>
                  
                  <View style={styles.goalProgressBar}>
                    <View 
                      style={[
                        styles.goalProgressBarFill, 
                        { width: `${Math.min(progressPercentage, 100)}%` }
                      ]} 
                    />
                  </View>
                  
                  <View style={styles.progressFooter}>
                    <Text style={styles.progressPercentage}>{progressPercentage}% complete</Text>
                    <Text style={styles.dueDate}>Due: {new Date(goal.due_date).toLocaleDateString()}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editGoalButton} 
                    onPress={() => router.push({
                      pathname: '/edit_goal',
                      params: { goalId: goal.id }
                    })}
                  >
                    <Text style={styles.editGoalButtonText}>Edit Goal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addMoneyButton} onPress={() => handleAddMoney(goal)}>
                    <Text style={styles.addMoneyButtonText}>Add Money</Text>
                  </TouchableOpacity>
              </View>
            </View>
          );
          })
        )}
        </View>

      {/* Month Selection Modal */}
      <Modal
        visible={showMonthModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMonthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.monthList}>
              {getMonthOptions().map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthOption,
                    selectedMonth === month && styles.selectedMonthOption
                  ]}
                  onPress={() => handleMonthSelect(month)}
                >
                  <Text style={[
                    styles.monthOptionText,
                    selectedMonth === month && styles.selectedMonthOptionText
                  ]}>
                    {month}
                  </Text>
                  {selectedMonth === month && (
                    <Ionicons name="checkmark" size={20} color="#6366f1" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  newGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
  },
  newGoalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 2,
  },
  infoCardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginLeft: 8,
  },
  infoCardNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  infoCardSubtext: {
    fontSize: 12,
    color: '#1976d2',
    opacity: 0.8,
  },
  progressCard: {
    borderRadius: 20,
    elevation: 3,
  },
  progressCardGradient: {
    padding: 24,
    borderRadius: 20,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  progressAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  progressTarget: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 4,
  },
  goalsSection: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  monthSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginRight: 8,
  },
  monthList: {
    maxHeight: 200,
  },
  monthOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedMonthOption: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
  },
  monthOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedMonthOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    width: '100%',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  goalIconContainer: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  goalSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  goalProgressSection: {
    marginTop: 12,
  },
  goalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalProgressLabel: {
    fontSize: 14,
    color: '#666',
  },
  goalProgressAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  goalProgressBarFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  editGoalButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  editGoalButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addMoneyButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  addMoneyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '80%',
    maxHeight: '70%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
}); 