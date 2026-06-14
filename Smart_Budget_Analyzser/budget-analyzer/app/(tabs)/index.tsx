import React, { useState, useCallback, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../supabase';
import { AuthContext, CurrencyContext } from '../_layout';
// import * as Notifications from 'expo-notifications'; // Removed for Expo Go compatibility

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface CustomBarChartProps {
  transactionCounts: number[];
  maxTransactions: number;
  width: number;
  height: number;
  barWidth: number;
  monthLabels: string[];
  onBarPress: (monthIndex: number) => void;
}
const CustomBarChart = ({ transactionCounts, maxTransactions, width, height, barWidth, monthLabels, onBarPress }: CustomBarChartProps) => {
  const barSpacing = 20;
  return (
    <View>
      <Svg width={width} height={height + 28}>
        {transactionCounts.map((count: number, i: number) => {
          const x = i * (barWidth + barSpacing);
          const barHeight = height;
          const fillRatio = count / maxTransactions;
          const darkHeight = fillRatio * barHeight;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={0} width={barWidth} height={barHeight} fill="#a3c9f9" rx={8} />
              {count > 0 && (
                <Rect x={x} y={barHeight - darkHeight} width={barWidth} height={darkHeight} fill="#304ffe" rx={8} />
              )}
              <SvgText x={x + barWidth / 2} y={height + 18} fontSize="12" fill="#636e72" textAnchor="middle">{monthLabels[i]}</SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      {/* Touchable overlay for bars */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' }}>
        {transactionCounts.map((count: number, i: number) => (
          <TouchableOpacity
            key={`touch-${i}`}
            style={{
              width: barWidth,
              height: height,
              marginRight: barSpacing,
            }}
            onPress={() => onBarPress(i)}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const { userId } = useContext(AuthContext) as { userId: string };
  const { currency, getCurrencySymbol } = useContext(CurrencyContext);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showBalance, setShowBalance] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const router = useRouter();

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (transactionError) throw transactionError;
      setTransactions(transactionData || []);

      // Fetch goals
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (goalError) throw goalError;
      setGoals(goalData || []);

      // Fetch categories (optional - don't throw error if it fails)
      try {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .eq('is_deleted', false);
        if (!categoryError) {
          console.log('Fetched categories:', categoryData);
          setCategories(categoryData || []);
        } else {
          console.log('Category error:', categoryError);
          // Set default categories if fetch fails
          setCategories([
            { id: '1', name: 'Food', user_id: userId },
            { id: '2', name: 'Transport', user_id: userId },
            { id: '3', name: 'Education', user_id: userId },
            { id: '4', name: 'Goals', user_id: userId },
            { id: '5', name: 'Extra', user_id: userId }
          ]);
        }
      } catch (categoryErr) {
        console.log('Categories fetch failed, using default categories');
        // Set default categories if fetch fails
        setCategories([
          { id: '1', name: 'Food', user_id: userId },
          { id: '2', name: 'Transport', user_id: userId },
          { id: '3', name: 'Education', user_id: userId },
          { id: '4', name: 'Goals', user_id: userId },
          { id: '5', name: 'Extra', user_id: userId }
        ]);
      }
    } catch (err) {
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  // Refresh transactions every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        fetchTransactions();
      }
    }, [userId])
  );

  // Calculate real values
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
  const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate real monthly transaction counts for selected year
  const getMonthlyTransactionCounts = () => {
    const monthlyCounts = new Array(12).fill(0);
    
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate.getFullYear() === selectedYear) {
        const month = transactionDate.getMonth();
        monthlyCounts[month]++;
      }
    });
    
    return monthlyCounts;
  };

  // Get available years from transactions
  const getAvailableYears = () => {
    const years = new Set<number>();
    transactions.forEach(transaction => {
      const year = new Date(transaction.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
  };

  const availableYears = getAvailableYears();
  
  // Debug logging
  console.log('Available years:', availableYears);
  console.log('Selected year:', selectedYear);
  console.log('Current index:', availableYears.indexOf(selectedYear));

  const monthlyTransactionCounts = getMonthlyTransactionCounts();
  const maxTransactions = 50; // Fixed maximum of 50 transactions per month

  // Get monthly transaction details
  const getMonthlyDetails = (monthIndex: number) => {
    const monthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getFullYear() === selectedYear && transactionDate.getMonth() === monthIndex;
    });

    const income = monthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expenses;
    const count = monthTransactions.length;

    // Category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    monthTransactions.forEach(t => {
      if (t.amount < 0) { // Only expenses
        const category = categories.find(c => c.id === t.category_id);
        const categoryName = category ? category.name : 'Other';
        categoryBreakdown[categoryName] = (categoryBreakdown[categoryName] || 0) + Math.abs(t.amount);
      }
    });

    return {
      monthName: monthLabels[monthIndex],
      year: selectedYear,
      income,
      expenses,
      balance,
      count,
      categoryBreakdown,
      transactions: monthTransactions
    };
  };

  // Handle bar press
  const handleBarPress = (monthIndex: number) => {
    setSelectedMonthIndex(monthIndex);
    setMonthModalVisible(true);
  };

  // Calculate savings data
  const getSavingsData = () => {
    // Calculate REAL savings (Income - Expenses)
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const realSavings = totalIncome - totalExpenses;
    
    // Calculate goal progress
    const totalGoalAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const goalProgress = totalGoalAmount > 0 ? (totalCurrentAmount / totalGoalAmount) * 100 : 0;
    
    // Calculate completed goals
    const completedGoals = goals.filter(goal => goal.current_amount >= goal.target_amount).length;
    
    return {
      totalSaved: realSavings,
      totalGoalAmount,
      savingsProgress: goalProgress,
      activeGoals: goals.length,
      completedGoals
    };
  };

  // Calculate AI Spending Score with real-time data
  const getAISpendingScore = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });
    
    const currentMonthExpenses = currentMonthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const currentMonthIncome = currentMonthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate spending ratio (expenses/income)
    const spendingRatio = currentMonthIncome > 0 ? (currentMonthExpenses / currentMonthIncome) : 1;
    
    // Enhanced AI scoring logic with real-time factors
    let score = 50; // Start with neutral score
    
    // Base score on spending ratio
    if (currentMonthIncome === 0 && currentMonthExpenses === 0) {
      score = 50; // No activity this month
    } else if (currentMonthIncome === 0 && currentMonthExpenses > 0) {
      score = 20; // Only expenses, no income
    } else if (spendingRatio > 0.9) score = 25; // Over 90% spending
    else if (spendingRatio > 0.8) score = 35; // Over 80% spending
    else if (spendingRatio > 0.7) score = 50; // Over 70% spending
    else if (spendingRatio > 0.6) score = 65; // Over 60% spending
    else if (spendingRatio > 0.5) score = 75; // Over 50% spending
    else score = 85; // Under 50% spending
    
    // Real-time adjustments
    const savingsRate = currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) : 0;
    
    // Bonus for high savings rate
    if (savingsRate > 0.4) score += 10; // Excellent savings
    else if (savingsRate > 0.3) score += 8; // Good savings
    else if (savingsRate > 0.2) score += 5; // Decent savings
    else if (savingsRate > 0.1) score += 2; // Minimal savings
    
    // Penalty for low savings
    if (savingsRate < 0.05) score -= 15; // Very low savings
    else if (savingsRate < 0.1) score -= 10; // Low savings
    
    // Bonus for consistent spending (not too many large transactions)
    const largeTransactions = currentMonthTransactions.filter(t => Math.abs(t.amount) > 2000).length;
    if (largeTransactions === 0) score += 5; // No large expenses
    else if (largeTransactions <= 2) score += 2; // Few large expenses
    else if (largeTransactions > 5) score -= 5; // Too many large expenses
    
    // Bonus for regular income
    const incomeTransactions = currentMonthTransactions.filter(t => t.amount > 0).length;
    if (incomeTransactions >= 2) score += 3; // Multiple income sources
    
    // Debug logging
    console.log('=== AI Score Calculation ===');
    console.log('Current Month Income:', currentMonthIncome);
    console.log('Current Month Expenses:', currentMonthExpenses);
    console.log('Spending Ratio:', spendingRatio);
    console.log('Savings Rate:', savingsRate);
    console.log('Large Transactions:', largeTransactions);
    console.log('Income Transactions:', incomeTransactions);
    console.log('Final Score:', Math.min(100, Math.max(0, Math.round(score))));
    console.log('===========================');
    
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  // Calculate AI Category Insights with real-time data
  const getAICategoryInsights = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });
    
    const expenses = currentMonthTransactions.filter(t => t.amount < 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    if (totalExpenses === 0) {
      return { 
        topCategory: 'No expenses', 
        percentage: 0, 
        amount: 0,
        trend: 'neutral',
        insight: 'No spending this month'
      };
    }
    
    // Group by category with enhanced data
    const categoryTotals: { [key: string]: number } = {};
    const categoryCounts: { [key: string]: number } = {};
    const categoryAverages: { [key: string]: number } = {};
    
    expenses.forEach(t => {
      let categoryName = 'Unknown';
      
      // Try to find category by ID first
      const category = categories.find((c: any) => c.id === t.category_id);
      if (category) {
        categoryName = category.name;
      } else {
        // If no category found, try to infer from description
        const description = t.description?.toLowerCase() || '';
        const notes = t.notes?.toLowerCase() || '';
        const combinedText = `${description} ${notes}`;
        
        if (combinedText.includes('food') || combinedText.includes('grocery') || combinedText.includes('restaurant') || combinedText.includes('meal') || combinedText.includes('lunch') || combinedText.includes('dinner') || combinedText.includes('breakfast')) {
          categoryName = 'Food';
        } else if (combinedText.includes('transport') || combinedText.includes('taxi') || combinedText.includes('uber') || combinedText.includes('fuel') || combinedText.includes('car') || combinedText.includes('bus') || combinedText.includes('train') || combinedText.includes('gas')) {
          categoryName = 'Transport';
        } else if (combinedText.includes('education') || combinedText.includes('course') || combinedText.includes('book') || combinedText.includes('study') || combinedText.includes('school') || combinedText.includes('college') || combinedText.includes('university')) {
          categoryName = 'Education';
        } else if (combinedText.includes('goal') || combinedText.includes('save') || combinedText.includes('investment') || combinedText.includes('contribution')) {
          categoryName = 'Goals';
        } else if (combinedText.includes('entertainment') || combinedText.includes('game') || combinedText.includes('movie') || combinedText.includes('shopping') || combinedText.includes('clothes') || combinedText.includes('electronics') || combinedText.includes('hobby')) {
          categoryName = 'Extra';
        } else {
          // Instead of defaulting to 'General', try to categorize based on amount patterns
          const amount = Math.abs(t.amount);
          if (amount < 100) {
            categoryName = 'Food'; // Small amounts likely food
          } else if (amount < 500) {
            categoryName = 'Transport'; // Medium amounts likely transport
          } else if (amount < 2000) {
            categoryName = 'Extra'; // Larger amounts likely extra expenses
          } else {
            categoryName = 'Goals'; // Very large amounts likely goals
          }
        }
      }
      
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Math.abs(t.amount);
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });
    
    // Calculate averages
    Object.keys(categoryTotals).forEach(category => {
      categoryAverages[category] = categoryTotals[category] / categoryCounts[category];
    });
    
    // If no categories found, return default
    if (Object.keys(categoryTotals).length === 0) {
      return { 
        topCategory: 'No expenses', 
        percentage: 0, 
        amount: 0,
        trend: 'neutral',
        insight: 'No spending this month'
      };
    }
    
    // Find top category
    const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
      categoryTotals[a] > categoryTotals[b] ? a : b
    );
    
    const topAmount = categoryTotals[topCategory];
    const percentage = Math.round((topAmount / totalExpenses) * 100);
    
    // Real-time insights
    let trend = 'neutral';
    let insight = '';
    
    if (percentage > 50) {
      trend = 'high';
      insight = 'High concentration';
    } else if (percentage > 30) {
      trend = 'medium';
      insight = 'Moderate spending';
    } else {
      trend = 'low';
      insight = 'Well distributed';
    }
    
    // Add specific insights based on category
    if (topCategory === 'Food' && percentage > 40) {
      insight = 'High food spending';
    } else if (topCategory === 'Transport' && percentage > 35) {
      insight = 'Transport heavy';
    } else if (topCategory === 'Education' && percentage > 25) {
      insight = 'Education focused';
    } else if (topCategory === 'Goals' && percentage > 20) {
      insight = 'Goal oriented';
    }
    
    return {
      topCategory,
      percentage,
      amount: topAmount,
      trend,
      insight
    };
  };

  // Test notification function removed - now available in Settings screen

  const savingsData = getSavingsData();
  const aiSpendingScore = getAISpendingScore();
  const aiCategoryInsights = getAICategoryInsights();

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#4f8cff" /><Text style={{ marginTop: 12, color: '#636e72', fontSize: 16 }}>Loading...</Text></View>;
  }
  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#e74c3c', fontSize: 16, fontWeight: 'bold' }}>{error}</Text></View>;
  }

  return (
    <ScrollView style={styles.mainContainer} contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f8cff']} />
      }>
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#4f8cff', '#6a82fb', '#a18cd1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Total Balance</Text>
            <TouchableOpacity onPress={() => setShowBalance((prev) => !prev)}>
              <Ionicons name={showBalance ? 'eye' : 'eye-off'} size={22} color="#fff" />
      </TouchableOpacity>
          </View>
          <Text style={styles.cardBalance}>
            {showBalance
              ? `${getCurrencySymbol(currency)}${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '****'}
          </Text>
          <View style={styles.incomeExpenseRowModern}>
            <View style={styles.incomeModernBox}>
              <Ionicons name="arrow-up" size={13} color="#3fffa8" style={{ marginRight: 4 }} />
              <Text style={styles.incomeExpenseModernTextSmall}>Income: <Text style={styles.incomeExpenseModernAmountSmall}>{getCurrencySymbol(currency)}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Text>
            </View>
            <View style={styles.expenseModernBox}>
              <Ionicons name="arrow-down" size={13} color="#ff7eb3" style={{ marginRight: 4 }} />
              <Text style={styles.incomeExpenseModernTextSmall}>Expenses: <Text style={styles.incomeExpenseModernAmountSmall}>{getCurrencySymbol(currency)}{Math.abs(totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Text>
      </View>
          </View>
        </LinearGradient>

        {/* AI-Powered Counter Cards */}
        <View style={styles.counterCardsRow}>
          {/* AI Spending Score Card */}
          <View style={styles.counterCard}>
            <LinearGradient
              colors={['#22c55e', '#16a34a', '#15803d']}
              style={styles.counterCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.counterCardHeader}>
                <Ionicons name="analytics" size={20} color="#fff" />
                <Text style={styles.counterCardTitle}>AI Score</Text>
              </View>
              <Text style={styles.counterCardAmount}>
                {aiSpendingScore}
              </Text>
              <View style={styles.counterCardProgress}>
                <View style={styles.counterCardProgressBar}>
                  <View 
                    style={[
                      styles.counterCardProgressFill, 
                      { width: `${aiSpendingScore}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.counterCardProgressText}>
                  {aiSpendingScore >= 85 ? 'Excellent' : aiSpendingScore >= 70 ? 'Good' : aiSpendingScore >= 50 ? 'Fair' : 'Needs Work'}
                </Text>
              </View>
              <Text style={styles.counterCardSubtext}>
                Real-time spending health
              </Text>
            </LinearGradient>
          </View>

          {/* AI Category Insights Card */}
          <View style={styles.counterCard}>
            <LinearGradient
              colors={['#3b82f6', '#2563eb', '#1d4ed8']}
              style={styles.counterCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.counterCardHeader}>
                <Ionicons name="pie-chart" size={20} color="#fff" />
                <Text style={styles.counterCardTitle}>Top Category</Text>
              </View>
              <Text style={styles.counterCardAmount}>
                {aiCategoryInsights.percentage}%
              </Text>
              <View style={styles.counterCardTrend}>
                <Text style={styles.counterCardTrendText}>
                  {aiCategoryInsights.topCategory}
                </Text>
              </View>
              <Text style={styles.counterCardSubtext}>
                {aiCategoryInsights.insight} • {getCurrencySymbol(currency)}{aiCategoryInsights.amount.toLocaleString()}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Add two outlined buttons here */}
        <View style={styles.buttonRowModern}>
          <TouchableOpacity style={[styles.outlinedButton, { borderColor: '#4f8cff' }]} 
            onPress={() => router.push('/add_transaction')}>
            <Ionicons name="add" size={22} color="#4f8cff" style={{ marginBottom: 2 }} />
            <Text style={[styles.outlinedButtonText, { color: '#222' }]}>Add Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.outlinedButton, { borderColor: '#a18cd1' }]} onPress={() => router.push('/transaction')}>
            <Ionicons name="time-outline" size={22} color="#a18cd1" style={{ marginBottom: 2 }} />
            <Text style={[styles.outlinedButtonText, { color: '#222' }]}>View History</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chartContainer}>
          <View style={styles.chartHeaderSection}>
            <View style={styles.chartTitleRow}>
              <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#6a82fb" style={{ marginRight: 8 }} />
              <Text style={styles.chartTitle}>Monthly Overview</Text>
            </View>
            
            {/* Year Selector */}
            <View style={styles.yearSelectorContainer}>
              <TouchableOpacity 
                style={styles.yearArrowButton}
                onPress={() => {
                  const currentIndex = availableYears.indexOf(selectedYear);
                  console.log('Left arrow - Current index:', currentIndex, 'Total years:', availableYears.length);
                  if (currentIndex < availableYears.length - 1) {
                    const newYear = availableYears[currentIndex + 1];
                    console.log('Moving to older year:', newYear);
                    setSelectedYear(newYear);
                  }
                }}
                disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={20} 
                  color={availableYears.indexOf(selectedYear) === availableYears.length - 1 ? '#dfe6e9' : '#6a82fb'} 
                />
              </TouchableOpacity>
              
              <View style={styles.yearDisplayBox}>
                <Ionicons name="calendar-outline" size={16} color="#6a82fb" style={{ marginRight: 6 }} />
                <Text style={styles.yearText}>{selectedYear}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.yearArrowButton}
                onPress={() => {
                  const currentIndex = availableYears.indexOf(selectedYear);
                  console.log('Right arrow - Current index:', currentIndex, 'Total years:', availableYears.length);
                  if (currentIndex > 0) {
                    const newYear = availableYears[currentIndex - 1];
                    console.log('Moving to newer year:', newYear);
                    setSelectedYear(newYear);
                  }
                }}
                disabled={availableYears.indexOf(selectedYear) === 0}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={availableYears.indexOf(selectedYear) === 0 ? '#dfe6e9' : '#6a82fb'} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Year Pills for Quick Selection */}
          {availableYears.length > 1 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.yearPillsContainer}
              contentContainerStyle={styles.yearPillsContent}
            >
              {availableYears.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearPill,
                    selectedYear === year && styles.yearPillActive
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[
                    styles.yearPillText,
                    selectedYear === year && styles.yearPillTextActive
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <CustomBarChart
              transactionCounts={monthlyTransactionCounts}
              maxTransactions={maxTransactions}
              width={monthLabels.length * 48}
              height={120}
              barWidth={24}
              monthLabels={monthLabels}
              onBarPress={handleBarPress}
            />
          </ScrollView>
        </View>

        {/* Monthly Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={monthModalVisible}
          onRequestClose={() => setMonthModalVisible(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setMonthModalVisible(false)}
          >
            <Pressable 
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              {selectedMonthIndex !== null && (() => {
                const details = getMonthlyDetails(selectedMonthIndex);
                const fillPercentage = maxTransactions > 0 ? (details.count / maxTransactions) * 100 : 0;
                
                return (
                  <>
                    <LinearGradient
                      colors={['#4f8cff', '#6a82fb']}
                      style={styles.modalHeader}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.modalHeaderContent}>
                        <View>
                          <Text style={styles.modalMonth}>{details.monthName} {details.year}</Text>
                          <Text style={styles.modalTransactionCount}>{details.count} Transactions</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => setMonthModalVisible(false)}
                          style={styles.modalCloseButton}
                        >
                          <Ionicons name="close-circle" size={32} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                      {/* Bar Fill Indicator */}
                      <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                          <Ionicons name="bar-chart" size={20} color="#4f8cff" />
                          <Text style={styles.modalSectionTitle}>Chart Fill Level</Text>
                        </View>
                        <View style={styles.fillLevelContainer}>
                          <View style={styles.fillLevelBar}>
                            <LinearGradient
                              colors={['#304ffe', '#536dfe']}
                              style={[styles.fillLevelFill, { width: `${fillPercentage}%` }]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            />
                          </View>
                          <Text style={styles.fillLevelText}>
                            {details.count} / {maxTransactions} ({fillPercentage.toFixed(1)}%)
                          </Text>
                        </View>
                      </View>

                      {/* Financial Summary */}
                      <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                          <Ionicons name="wallet" size={20} color="#4f8cff" />
                          <Text style={styles.modalSectionTitle}>Financial Summary</Text>
                        </View>
                        <View style={styles.summaryGrid}>
                          <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
                            <Ionicons name="arrow-up" size={24} color="#4caf50" />
                            <Text style={styles.summaryLabel}>Income</Text>
                            <Text style={[styles.summaryAmount, { color: '#4caf50' }]}>
                              {getCurrencySymbol(currency)}{details.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                          </View>
                          <View style={[styles.summaryCard, { backgroundColor: '#ffebee' }]}>
                            <Ionicons name="arrow-down" size={24} color="#f44336" />
                            <Text style={styles.summaryLabel}>Expenses</Text>
                            <Text style={[styles.summaryAmount, { color: '#f44336' }]}>
                              {getCurrencySymbol(currency)}{details.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                          </View>
                          <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
                            <Ionicons name="trending-up" size={24} color="#2196f3" />
                            <Text style={styles.summaryLabel}>Balance</Text>
                            <Text style={[styles.summaryAmount, { color: details.balance >= 0 ? '#4caf50' : '#f44336' }]}>
                              {getCurrencySymbol(currency)}{details.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Category Breakdown */}
                      {Object.keys(details.categoryBreakdown).length > 0 && (
                        <View style={styles.modalSection}>
                          <View style={styles.modalSectionHeader}>
                            <Ionicons name="pie-chart" size={20} color="#4f8cff" />
                            <Text style={styles.modalSectionTitle}>Expense Categories</Text>
                          </View>
                          {Object.entries(details.categoryBreakdown)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([category, amount]) => {
                              const percentage = details.expenses > 0 ? ((amount as number) / details.expenses) * 100 : 0;
                              return (
                                <View key={category} style={styles.categoryItem}>
                                  <View style={styles.categoryHeader}>
                                    <Text style={styles.categoryName}>{category}</Text>
                                    <Text style={styles.categoryAmount}>
                                      {getCurrencySymbol(currency)}{(amount as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                  </View>
                                  <View style={styles.categoryBarContainer}>
                                    <View style={styles.categoryBar}>
                                      <LinearGradient
                                        colors={['#4f8cff', '#6a82fb']}
                                        style={[styles.categoryBarFill, { width: `${percentage}%` }]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                      />
                                    </View>
                                    <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                                  </View>
                                </View>
                              );
                            })}
                        </View>
                      )}

                      {/* Quick Actions */}
                      <View style={styles.modalSection}>
                        <TouchableOpacity 
                          style={styles.viewDetailsButton}
                          onPress={() => {
                            setMonthModalVisible(false);
                            router.push('/transaction');
                          }}
                        >
                          <Ionicons name="list" size={20} color="#fff" />
                          <Text style={styles.viewDetailsButtonText}>View All Transactions</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </>
                );
              })()}
            </Pressable>
          </Pressable>
        </Modal>
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  card: {
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  cardBalance: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 36,
    marginBottom: 8,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 4,
    gap: 24,
  },
  incomeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 0,
  },
  expenseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 0,
  },
  incomeExpenseText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  incomeExpenseAmount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  incomeExpenseRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 4,
    gap: 24,
  },
  incomeModernBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 0,
  },
  expenseModernBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 29, // Move the Expenses label and icon further to the right
  },
  incomeExpenseModernText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
  incomeExpenseModernAmount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  incomeExpenseModernTextSmall: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  incomeExpenseModernAmountSmall: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeaderSection: {
    marginBottom: 12,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    letterSpacing: 0.5,
  },
  yearSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  yearArrowButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  yearDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f3ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#6a82fb',
  },
  yearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6a82fb',
  },
  yearPillsContainer: {
    marginBottom: 12,
    marginHorizontal: -4,
  },
  yearPillsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  yearPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  yearPillActive: {
    backgroundColor: '#6a82fb',
    borderColor: '#6a82fb',
  },
  yearPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636e72',
  },
  yearPillTextActive: {
    color: '#fff',
  },
  buttonRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 0,
    gap: 12,
  },
  outlinedButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    shadowColor: '#4f8cff',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  outlinedButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  counterCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  counterCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 120,
  },
  counterCardGradient: {
    padding: 16,
    minHeight: 120,
    height: '100%',
    flex: 1,
  },
  counterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterCardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  counterCardAmount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  counterCardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  counterCardProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  counterCardProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  counterCardProgressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  counterCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  counterCardTrendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  counterCardSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalMonth: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalTransactionCount: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalSection: {
    marginTop: 20,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginLeft: 8,
  },
  fillLevelContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  fillLevelBar: {
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fillLevelFill: {
    height: '100%',
    borderRadius: 6,
  },
  fillLevelText: {
    fontSize: 14,
    color: '#636e72',
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f8cff',
  },
  categoryBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636e72',
    width: 45,
    textAlign: 'right',
  },
  viewDetailsButton: {
    backgroundColor: '#4f8cff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  viewDetailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
