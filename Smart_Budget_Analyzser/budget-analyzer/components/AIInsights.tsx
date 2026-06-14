import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import aiService from '../app/services/AIService';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  category?: { name: string } | string | null;
  description: string;
  category_name?: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  category: string;
  due_date: string;
  created_at: string;
}

interface AIInsightsProps {
  transactions?: Transaction[];
  goals?: Goal[];
  currencySymbol?: string;
}

interface SpendingInsights {
  totalSpent: number;
  categoryBreakdown: Record<string, number>;
  averageAmount: number;
  topCategories: Array<{
    category: string;
    amount: number;
  }>;
  unusualTransactions: Transaction[];
}

interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions = [], goals = [], currencySymbol = '₹' }) => {
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (transactions.length > 0) {
      generateInsights();
    }
  }, [transactions, goals]);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const spendingInsights = aiService.getSpendingInsights(transactions);
      const budgetRecommendations = aiService.getBudgetRecommendations(transactions, goals, currencySymbol);
      
      setInsights(spendingInsights);
      setRecommendations(budgetRecommendations);
    } catch (error) {
      console.error('AI insights error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'warning';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="brain" size={20} color="#666" />
          <Text style={styles.loadingText}>AI analyzing your spending...</Text>
        </View>
      </View>
    );
  }

  if (!insights || transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics" size={24} color="#ccc" />
          <Text style={styles.emptyText}>Add transactions to get AI insights</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="brain" size={18} color="#fff" />
          </View>
          <Text style={styles.title}>🤖 AI Spending Insights</Text>
          <TouchableOpacity 
            onPress={() => setShowDetails(!showDetails)}
            style={styles.toggleButton}
          >
            <Ionicons 
              name={showDetails ? "chevron-up" : "chevron-down"} 
              size={18} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.statItem}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>{currencySymbol}{insights.totalSpent.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </LinearGradient>
          </View>
          <View style={styles.statItem}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>{currencySymbol}{Math.round(insights.averageAmount).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Average</Text>
            </LinearGradient>
          </View>
          <View style={styles.statItem}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.statCard}
            >
                             <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail">
                 {insights.topCategories.length > 0 ? insights.topCategories[0].category : 'N/A'}
               </Text>
               <Text style={styles.statLabel}>Top Category</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Spending Trend */}
        {(insights as any).spendingTrend && (
          <LinearGradient
            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
            style={styles.trendContainer}
          >
            <View style={styles.trendHeader}>
              <Ionicons 
                name={(insights as any).spendingTrend === 'increasing' ? 'trending-up' : 
                      (insights as any).spendingTrend === 'decreasing' ? 'trending-down' : 'remove'} 
                size={18} 
                color={(insights as any).spendingTrend === 'increasing' ? '#FF6B6B' : 
                       (insights as any).spendingTrend === 'decreasing' ? '#4ECDC4' : '#fff'} 
              />
              <Text style={styles.trendTitle}>📈 Spending Trend</Text>
            </View>
            <Text style={[
              styles.trendValue, 
              { 
                color: (insights as any).spendingTrend === 'increasing' ? '#FF6B6B' : 
                       (insights as any).spendingTrend === 'decreasing' ? '#4ECDC4' : '#fff' 
              }
            ]}>
              {(insights as any).spendingTrend === 'increasing' ? `+${(insights as any).monthlyComparison.toFixed(1)}%` :
               (insights as any).spendingTrend === 'decreasing' ? `${(insights as any).monthlyComparison.toFixed(1)}%` :
               'Stable'} from last month
            </Text>
          </LinearGradient>
        )}

        {/* Top Categories */}
        {insights.topCategories.length > 0 && (
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>🎯 Top Spending Categories:</Text>
            {insights.topCategories.map((cat, index) => (
              <LinearGradient
                key={index}
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.categoryItem}
              >
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.category}</Text>
                  <Text style={styles.categoryAmount}>{currencySymbol}{cat.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={index === 0 ? ['#FF6B6B', '#FF8E8E'] : 
                           index === 1 ? ['#4ECDC4', '#6EE7DF'] : 
                           ['#45B7D1', '#67C9E1']}
                    style={[
                      styles.progressFill, 
                      { width: `${(cat.amount / insights.totalSpent) * 100}%` }
                    ]} 
                  />
                </View>
              </LinearGradient>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>💡 AI Recommendations:</Text>
            <ScrollView 
              style={styles.recommendationsList} 
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {recommendations.map((rec, index) => (
                <LinearGradient
                  key={index}
                  colors={rec.priority === 'high' ? ['rgba(255,107,107,0.2)', 'rgba(255,107,107,0.1)'] :
                         rec.priority === 'medium' ? ['rgba(255,193,7,0.2)', 'rgba(255,193,7,0.1)'] :
                         ['rgba(76,175,80,0.2)', 'rgba(76,175,80,0.1)']}
                  style={styles.recommendationItem}
                >
                  <View style={styles.recommendationHeader}>
                    <Ionicons 
                      name={getPriorityIcon(rec.priority)} 
                      size={18} 
                      color={getPriorityColor(rec.priority)} 
                    />
                    <Text style={[styles.recommendationPriority, { color: getPriorityColor(rec.priority) }]}>
                      {rec.priority.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.recommendationMessage}>{rec.message}</Text>
                  <Text style={styles.recommendationSuggestion}>{rec.suggestion}</Text>
                </LinearGradient>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Unusual Transactions */}
        {insights.unusualTransactions.length > 0 && showDetails && (
          <View style={styles.unusualContainer}>
            <Text style={styles.sectionTitle}>Unusual Transactions:</Text>
            <Text style={styles.unusualText}>
              {insights.unusualTransactions.length} transaction(s) with amounts significantly higher than your average.
            </Text>
          </View>
        )}

        {/* Detailed Analysis */}
        {showDetails && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Detailed Analysis:</Text>
                         <Text style={styles.analysisText}>
               Based on your {transactions.length} transactions, your average spending per transaction is {currencySymbol}{Math.round(insights.averageAmount).toLocaleString()}. 
               {insights.topCategories.length > 0 && ` Your highest spending category is ${insights.topCategories[0].category} with ${currencySymbol}${insights.topCategories[0].amount.toLocaleString()}.`}
             </Text>
            
            {goals.length > 0 && (
              <Text style={styles.analysisText}>
                You have {goals.length} active financial goal(s). Consider reviewing your spending patterns to ensure you're on track to meet your goals.
              </Text>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientContainer: {
    padding: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: {
    marginLeft: 8,
    color: '#ccc',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  toggleButton: {
    padding: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    minWidth: 85,
    maxWidth: 100,
  },
  statCard: {
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    height: 65,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  trendContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  trendTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryItem: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationsContainer: {
    marginBottom: 16,
  },
  recommendationsList: {
    maxHeight: 250,
    paddingRight: 8,
  },
  recommendationItem: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationPriority: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recommendationMessage: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 6,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recommendationSuggestion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  unusualContainer: {
    marginBottom: 16,
  },
  unusualText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: 12,
  },
  analysisText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginBottom: 8,
  },
});

export default AIInsights; 