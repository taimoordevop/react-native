import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { AuthContext } from '../_layout';
import { CurrencyContext } from '../_layout';
import AIInsights from '../../components/AIInsights';

type Transaction = {
  id: string;
  amount: number;
  date: string;
  category?: { name: string } | string | null;
  description: string;
};

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  category: string;
  due_date: string;
  created_at: string;
};

export default function AnalyticsScreen() {
  const { userId } = useContext(AuthContext);
  const { currency, getCurrencySymbol } = useContext(CurrencyContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchData();
  }, [userId, selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*, category:categories(name)')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (transactionError) {
        console.error('Error fetching transactions:', transactionError);
      } else {
        setTransactions(transactionData || []);
      }

      // Fetch goals
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (goalError) {
        console.error('Error fetching goals:', goalError);
      } else {
        setGoals(goalData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions by selected period
  const getFilteredTransactions = () => {
    const now = new Date();
    const filtered = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      
      switch (selectedPeriod) {
        case 'week':
          // Get start of current week (Sunday)
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          
          // Get end of current week (Saturday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          return transactionDate >= weekStart && transactionDate <= weekEnd;
          
        case 'month':
          // Get start of current month
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          monthStart.setHours(0, 0, 0, 0);
          
          // Get end of current month
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          
          return transactionDate >= monthStart && transactionDate <= monthEnd;
          
        case 'year':
          // Get start of current year
          const yearStart = new Date(now.getFullYear(), 0, 1);
          yearStart.setHours(0, 0, 0, 0);
          
          // Get end of current year
          const yearEnd = new Date(now.getFullYear(), 11, 31);
          yearEnd.setHours(23, 59, 59, 999);
          
          return transactionDate >= yearStart && transactionDate <= yearEnd;
          
        default:
          return true;
      }
    });
    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate analytics
  const totalIncome = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netIncome = totalIncome - totalExpenses;

  // Category breakdown
  const getCategoryBreakdown = () => {
    const categoryMap = new Map<string, number>();
    
    filteredTransactions
      .filter(t => t.amount < 0) // Only expenses
      .forEach(t => {
        const categoryName = typeof t.category === 'object' && t.category !== null 
          ? t.category.name 
          : (typeof t.category === 'string' ? t.category : 'Other');
        
        const currentAmount = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, currentAmount + Math.abs(t.amount));
      });

    return Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const categoryBreakdown = getCategoryBreakdown();

  // Filter goals by selected period based on due_date
  const getFilteredGoals = () => {
    const now = new Date();
    const filtered = goals.filter(g => {
      const goalDueDate = new Date(g.due_date);
      
      switch (selectedPeriod) {
        case 'week':
          // Get start of current week (Sunday)
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          
          // Get end of current week (Saturday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          return goalDueDate >= weekStart && goalDueDate <= weekEnd;
          
        case 'month':
          // Get start of current month
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          monthStart.setHours(0, 0, 0, 0);
          
          // Get end of current month
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          
          return goalDueDate >= monthStart && goalDueDate <= monthEnd;
          
        case 'year':
          // Get start of current year
          const yearStart = new Date(now.getFullYear(), 0, 1);
          yearStart.setHours(0, 0, 0, 0);
          
          // Get end of current year
          const yearEnd = new Date(now.getFullYear(), 11, 31);
          yearEnd.setHours(23, 59, 59, 999);
          
          return goalDueDate >= yearStart && goalDueDate <= yearEnd;
          
        default:
          return true;
      }
    });
    return filtered;
  };

  const filteredGoals = getFilteredGoals();

  // Goal progress (filtered by period)
  const totalGoals = filteredGoals.length;
  const completedGoals = filteredGoals.filter(g => g.current_amount >= g.target_amount).length;
  const totalTargetAmount = filteredGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalCurrentAmount = filteredGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallGoalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  // Monthly trend (last 6 months)
  const getMonthlyTrend = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'short' });
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const monthIncome = monthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const monthExpenses = monthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      months.push({
        name: monthName,
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses
      });
    }
    
    return months;
  };

  const monthlyTrend = getMonthlyTrend();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Your financial insights</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('year')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'year' && styles.periodButtonTextActive]}>
            Year
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#e8f8f2' }]}>
          <View style={styles.summaryCardHeader}>
            <Ionicons name="trending-up" size={24} color="#10b981" />
            <Text style={styles.summaryCardTitle}>Income</Text>
          </View>
          <Text style={[styles.summaryCardAmount, { color: '#10b981' }]}>
            {getCurrencySymbol(currency)}{totalIncome.toLocaleString()}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#fef2f2' }]}>
          <View style={styles.summaryCardHeader}>
            <Ionicons name="trending-down" size={24} color="#ef4444" />
            <Text style={styles.summaryCardTitle}>Expenses</Text>
          </View>
          <Text style={[styles.summaryCardAmount, { color: '#ef4444' }]}>
            {getCurrencySymbol(currency)}{totalExpenses.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#eff6ff' }]}>
          <View style={styles.summaryCardHeader}>
            <Ionicons name="wallet" size={24} color="#3b82f6" />
            <Text style={styles.summaryCardTitle}>Net</Text>
          </View>
          <Text style={[styles.summaryCardAmount, { color: netIncome >= 0 ? '#10b981' : '#ef4444' }]}>
            {getCurrencySymbol(currency)}{netIncome.toLocaleString()}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#f0f9ff' }]}>
          <View style={styles.summaryCardHeader}>
            <Ionicons name="flag" size={24} color="#0ea5e9" />
            <Text style={styles.summaryCardTitle}>Goals</Text>
          </View>
          <Text style={[styles.summaryCardAmount, { color: '#0ea5e9' }]}>
            {completedGoals}/{totalGoals}
          </Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        {categoryBreakdown.length > 0 ? (
          categoryBreakdown.map((category, index) => {
            const percentage = totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0;
            return (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryAmount}>
                    {getCurrencySymbol(currency)}{category.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.categoryProgress}>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.categoryProgressBar, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No spending data for this period</Text>
        )}
      </View>

      {/* Monthly Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Trend (Last 6 Months)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendContainer}>
          {monthlyTrend.map((month, index) => (
            <View key={index} style={styles.trendItem}>
              <Text style={styles.trendMonth}>{month.name}</Text>
              <View style={styles.trendBars}>
                <View style={[styles.trendBar, styles.incomeBar, { height: Math.max(10, (month.income / Math.max(...monthlyTrend.map(m => m.income))) * 60) }]} />
                <View style={[styles.trendBar, styles.expenseBar, { height: Math.max(10, (month.expenses / Math.max(...monthlyTrend.map(m => m.expenses))) * 60) }]} />
              </View>
              <Text style={[styles.trendNet, { color: month.net >= 0 ? '#10b981' : '#ef4444' }]}>
                {getCurrencySymbol(currency)}{month.net.toLocaleString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Goal Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal Progress</Text>
        <View style={styles.goalProgressCard}>
          <View style={styles.goalProgressHeader}>
            <Text style={styles.goalProgressTitle}>Overall Progress</Text>
            <Text style={styles.goalProgressAmount}>
              {getCurrencySymbol(currency)}{totalCurrentAmount.toLocaleString()} / {getCurrencySymbol(currency)}{totalTargetAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.goalProgressBar}>
            <View style={[styles.goalProgressBarFill, { width: `${Math.min(overallGoalProgress, 100)}%` }]} />
          </View>
          <Text style={styles.goalProgressPercentage}>{overallGoalProgress.toFixed(1)}% complete</Text>
        </View>

        {filteredGoals.length > 0 ? (
          filteredGoals.slice(0, 3).map((goal, index) => {
            const progress = goal.current_amount / goal.target_amount;
            const progressPercentage = Math.round(progress * 100);
            return (
              <View key={goal.id} style={styles.goalItem}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalAmount}>
                    {getCurrencySymbol(currency)}{goal.current_amount.toLocaleString()} / {getCurrencySymbol(currency)}{goal.target_amount.toLocaleString()}
                  </Text>
                </View>
                                 <View style={styles.goalProgress}>
                   <View style={styles.goalProgressBarContainer}>
                     <View style={[styles.goalProgressBarFill, { width: `${Math.min(progressPercentage, 100)}%` }]} />
                   </View>
                   <Text style={styles.goalProgressText}>{progressPercentage}%</Text>
                 </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>
            {selectedPeriod === 'week' 
              ? 'No goals due this week' 
              : selectedPeriod === 'month'
              ? 'No goals due this month'
              : 'No goals due this year'
            }
          </Text>
        )}
      </View>

                  {/* AI Insights */}
            <View style={styles.section}>
              <AIInsights
                transactions={filteredTransactions}
                goals={filteredGoals}
                currencySymbol={getCurrencySymbol(currency)}
              />
            </View>

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  summaryCardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  categoryItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  categoryProgress: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 8,
  },
  categoryProgressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'flex-end',
  },
  trendContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  trendItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 60,
  },
  trendMonth: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    marginBottom: 8,
  },
  trendBar: {
    width: 8,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  incomeBar: {
    backgroundColor: '#10b981',
  },
  expenseBar: {
    backgroundColor: '#ef4444',
  },
  trendNet: {
    fontSize: 10,
    fontWeight: '600',
  },
  goalProgressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  goalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  goalProgressAmount: {
    fontSize: 14,
    color: '#666',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  goalProgressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  goalProgressPercentage: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  goalItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  goalAmount: {
    fontSize: 12,
    color: '#666',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalProgressBarContainer: {
    width: '60%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginRight: 8,
  },
  goalProgressText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    minWidth: 30,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
    padding: 20,
  },
  bottomPadding: {
    height: 20,
  },
});