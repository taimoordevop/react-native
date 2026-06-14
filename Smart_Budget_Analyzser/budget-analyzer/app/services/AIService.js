import * as SecureStore from 'expo-secure-store';

// AI Service for Smart Budget Analyzer
class AIService {
  constructor() {
    this.keywordRules = {
      'Food': [
        'grocery', 'food', 'restaurant', 'cafe', 'pizza', 'burger', 'meal', 'lunch', 'dinner', 'breakfast',
        'snack', 'coffee', 'tea', 'milk', 'bread', 'rice', 'chicken', 'beef', 'vegetables', 'fruits',
        'supermarket', 'market', 'store', 'shop', 'bakery', 'butcher', 'fish', 'eggs', 'cheese'
      ],
      'Transport': [
        'taxi', 'uber', 'bus', 'train', 'metro', 'fuel', 'gas', 'petrol', 'diesel', 'parking',
        'fare', 'ticket', 'transport', 'commute', 'ride', 'car', 'bike', 'motorcycle', 'auto',
        'rickshaw', 'cab', 'driver', 'road', 'highway', 'toll', 'maintenance', 'repair', 'service'
      ],
      'Education': [
        'course', 'class', 'lecture', 'tutorial', 'training', 'workshop', 'seminar', 'conference',
        'book', 'textbook', 'library', 'school', 'college', 'university', 'tuition', 'fee',
        'subscription', 'online', 'learning', 'study', 'exam', 'test', 'certificate', 'degree',
        'software', 'app', 'tool', 'platform', 'website', 'service'
      ],
      'Goals': [
        'goal', 'save', 'saving', 'investment', 'fund', 'target', 'plan', 'future', 'dream',
        'house', 'car', 'bike', 'vacation', 'trip', 'wedding', 'business', 'startup', 'project',
        'emergency', 'retirement', 'education', 'health', 'insurance', 'property', 'land'
      ],
      'Extra': [
        'entertainment', 'movie', 'game', 'gaming', 'pubg', 'fortnite', 'netflix', 'youtube',
        'music', 'concert', 'party', 'celebration', 'birthday', 'gift', 'present', 'shopping',
        'clothes', 'shoes', 'accessories', 'cosmetics', 'beauty', 'salon', 'spa', 'massage',
        'hobby', 'sport', 'fitness', 'gym', 'health', 'medical', 'doctor', 'medicine', 'pharmacy'
      ]
    };
    
    this.amountRules = {
      'Food': { min: 50, max: 5000, typical: 1000 },
      'Transport': { min: 100, max: 3000, typical: 500 },
      'Education': { min: 200, max: 10000, typical: 2000 },
      'Goals': { min: 500, max: 50000, typical: 5000 },
      'Extra': { min: 100, max: 10000, typical: 1500 }
    };
  }

  // Predict category based on description, amount, and notes
  predictCategory(description, amount, notes = '') {
    try {
      const text = `${description} ${notes}`.toLowerCase();
      const amountAbs = Math.abs(amount);
      
      // Calculate scores for each category
      const scores = {};
      
      for (const [category, keywords] of Object.entries(this.keywordRules)) {
        let score = 0;
        
        // Keyword matching (70% weight)
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            score += 0.7;
          }
        }
        
        // Amount-based scoring (30% weight)
        const amountRule = this.amountRules[category];
        if (amountRule) {
          const amountScore = this.calculateAmountScore(amountAbs, amountRule);
          score += amountScore * 0.3;
        }
        
        scores[category] = score;
      }
      
      // Find the best category
      let bestCategory = 'Extra'; // Default fallback
      let bestScore = 0;
      
      for (const [category, score] of Object.entries(scores)) {
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }
      
      // Calculate confidence
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      const confidence = totalScore > 0 ? bestScore / totalScore : 0.2;
      
      // Get top 3 predictions
      const sortedCategories = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category, score]) => ({
          category,
          confidence: totalScore > 0 ? score / totalScore : 0.1
        }));
      
      return {
        predicted_category: bestCategory,
        confidence: Math.min(confidence, 0.95), // Cap at 95%
        top_predictions: sortedCategories,
        scores: scores
      };
      
    } catch (error) {
      console.error('AI prediction error:', error);
      return {
        predicted_category: 'Extra',
        confidence: 0.1,
        top_predictions: [{ category: 'Extra', confidence: 0.1 }],
        scores: {}
      };
    }
  }

  // Calculate amount-based score
  calculateAmountScore(amount, rule) {
    const { min, max, typical } = rule;
    
    if (amount < min) return 0.1;
    if (amount > max) return 0.3;
    
    // Higher score for amounts closer to typical
    const distance = Math.abs(amount - typical);
    const range = max - min;
    return Math.max(0.1, 1 - (distance / range));
  }

  // Get category suggestions for a transaction
  getCategorySuggestions(description, amount, notes = '') {
    const prediction = this.predictCategory(description, amount, notes);
    return prediction.top_predictions;
  }

  // Check if AI prediction is confident enough to auto-assign
  isConfidentPrediction(prediction, threshold = 0.6) {
    return prediction.confidence >= threshold;
  }

  // Get spending insights
  getSpendingInsights(transactions) {
    try {
      const insights = {
        totalSpent: 0,
        categoryBreakdown: {},
        averageAmount: 0,
        topCategories: [],
        unusualTransactions: [],
        spendingTrend: 'stable',
        monthlyComparison: 0
      };

      if (!transactions || transactions.length === 0) {
        return insights;
      }

      // Filter only expense transactions (negative amounts)
      const expenses = transactions.filter(t => t.amount < 0);
      
      if (expenses.length === 0) {
        return insights;
      }

      // Calculate totals
      insights.totalSpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      insights.averageAmount = insights.totalSpent / expenses.length;

      // Category breakdown
      const categoryTotals = {};
      expenses.forEach(transaction => {
        let categoryName = 'Unknown';
        
        // Handle different category formats
        if (typeof transaction.category === 'object' && transaction.category?.name) {
          categoryName = transaction.category.name;
        } else if (typeof transaction.category === 'string') {
          categoryName = transaction.category;
        } else if (transaction.category_name) {
          categoryName = transaction.category_name;
        }
        
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Math.abs(transaction.amount);
      });

      insights.categoryBreakdown = categoryTotals;

      // Top categories
      insights.topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category, amount]) => ({ category, amount }));

      // Unusual transactions (amount > 2x average)
      insights.unusualTransactions = expenses.filter(t => 
        Math.abs(t.amount) > insights.averageAmount * 2
      );

      // Spending trend analysis
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const currentMonthExpenses = expenses.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });
      
      const previousMonthExpenses = expenses.filter(t => {
        const transactionDate = new Date(t.date);
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return transactionDate.getMonth() === prevMonth && 
               transactionDate.getFullYear() === prevYear;
      });

      const currentMonthTotal = currentMonthExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const previousMonthTotal = previousMonthExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      if (previousMonthTotal > 0) {
        insights.monthlyComparison = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
        
        if (insights.monthlyComparison > 10) {
          insights.spendingTrend = 'increasing';
        } else if (insights.monthlyComparison < -10) {
          insights.spendingTrend = 'decreasing';
        } else {
          insights.spendingTrend = 'stable';
        }
      }

      return insights;

    } catch (error) {
      console.error('Error generating insights:', error);
      return {
        totalSpent: 0,
        categoryBreakdown: {},
        averageAmount: 0,
        topCategories: [],
        unusualTransactions: [],
        spendingTrend: 'stable',
        monthlyComparison: 0
      };
    }
  }

  // Get budget recommendations
  getBudgetRecommendations(transactions, goals = [], currencySymbol = '₹') {
    try {
      const insights = this.getSpendingInsights(transactions);
      const recommendations = [];

      if (!insights || insights.totalSpent === 0) {
        return recommendations;
      }

      // Calculate income from transactions (positive amounts)
      const incomeTransactions = transactions.filter(t => t.amount > 0);
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const monthlyIncome = totalIncome || 50000; // Default if no income transactions
      
      // Calculate savings rate
      const savingsRate = ((monthlyIncome - insights.totalSpent) / monthlyIncome) * 100;

      // Spending trend recommendations
      if (insights.spendingTrend === 'increasing' && insights.monthlyComparison > 20) {
        recommendations.push({
          type: 'trend',
          priority: 'high',
          message: `Your spending increased by ${insights.monthlyComparison.toFixed(1)}% this month.`,
          suggestion: 'Review recent transactions and identify areas where you can reduce expenses.'
        });
      } else if (insights.spendingTrend === 'decreasing' && insights.monthlyComparison < -15) {
        recommendations.push({
          type: 'trend',
          priority: 'low',
          message: `Great job! Your spending decreased by ${Math.abs(insights.monthlyComparison).toFixed(1)}% this month.`,
          suggestion: 'Keep up the good work! Consider increasing your savings or goal contributions.'
        });
      }

      // Savings rate recommendations
      if (savingsRate < 10) {
        recommendations.push({
          type: 'savings',
          priority: 'high',
          message: `Your savings rate is ${savingsRate.toFixed(1)}%. This is below the recommended 20%.`,
          suggestion: 'Consider reducing spending in your top categories and setting up automatic savings.'
        });
      } else if (savingsRate < 20) {
        recommendations.push({
          type: 'savings',
          priority: 'medium',
          message: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for 20% for better financial health.`,
          suggestion: 'Look for opportunities to increase savings by 10% more.'
        });
      } else {
        recommendations.push({
          type: 'savings',
          priority: 'low',
          message: `Excellent! Your savings rate is ${savingsRate.toFixed(1)}%.`,
          suggestion: 'Consider investing your savings or contributing more to your financial goals.'
        });
      }

      // Category-specific recommendations
      insights.topCategories.forEach(({ category, amount }, index) => {
        const percentage = (amount / insights.totalSpent) * 100;
        
        if (percentage > 50) {
          recommendations.push({
            type: 'category',
            priority: 'high',
            message: `${category} accounts for ${percentage.toFixed(1)}% of your spending - this is very high.`,
            suggestion: `Consider setting a strict budget limit for ${category} and look for ways to reduce costs.`
          });
        } else if (percentage > 30) {
          recommendations.push({
            type: 'category',
            priority: 'medium',
            message: `${category} is your top spending category at ${percentage.toFixed(1)}%.`,
            suggestion: `Monitor your ${category} spending and set a monthly budget target.`
          });
        }
      });

      // Unusual spending recommendations
      if (insights.unusualTransactions.length > 0) {
        const unusualTotal = insights.unusualTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const unusualPercentage = (unusualTotal / insights.totalSpent) * 100;
        
        if (unusualPercentage > 20) {
          recommendations.push({
            type: 'unusual',
            priority: 'medium',
            message: `You have ${insights.unusualTransactions.length} unusual transactions totaling ${unusualPercentage.toFixed(1)}% of your spending.`,
            suggestion: 'Review these transactions to ensure they were necessary and plan for similar expenses.'
          });
        }
      }

      // Goal-based recommendations
      if (goals.length > 0) {
        const activeGoals = goals.filter(goal => {
          const dueDate = new Date(goal.due_date);
          const now = new Date();
          return dueDate > now;
        });

        if (activeGoals.length > 0) {
          const totalGoalAmount = activeGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
          const totalCurrentAmount = activeGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
          const remainingAmount = totalGoalAmount - totalCurrentAmount;
          
          // Calculate required monthly contribution
          const avgMonthsToComplete = activeGoals.reduce((sum, goal) => {
            const dueDate = new Date(goal.due_date);
            const now = new Date();
            const monthsLeft = Math.max(1, (dueDate.getFullYear() - now.getFullYear()) * 12 + 
              dueDate.getMonth() - now.getMonth());
            return sum + monthsLeft;
          }, 0) / activeGoals.length;
          
          const requiredMonthlyContribution = remainingAmount / avgMonthsToComplete;
          const currentMonthlyContribution = insights.totalSpent * 0.1; // Assume 10% of spending goes to goals
          
                     if (requiredMonthlyContribution > monthlyIncome * 0.4) {
             recommendations.push({
               type: 'goals',
               priority: 'high',
               message: `Your goals require ${currencySymbol}${requiredMonthlyContribution.toFixed(0)} monthly contribution.`,
               suggestion: 'Consider extending goal timelines, reducing goal amounts, or increasing income.'
             });
           } else if (requiredMonthlyContribution > currentMonthlyContribution) {
             recommendations.push({
               type: 'goals',
               priority: 'medium',
               message: `Increase goal contributions to ${currencySymbol}${requiredMonthlyContribution.toFixed(0)} monthly.`,
               suggestion: 'Set up automatic transfers to ensure you meet your goal targets.'
             });
           }
        }
      }

      // General financial health recommendations
      if (insights.averageAmount > monthlyIncome * 0.1) {
        recommendations.push({
          type: 'general',
          priority: 'medium',
          message: 'Your average transaction amount is quite high relative to your income.',
          suggestion: 'Consider breaking down large purchases or looking for more affordable alternatives.'
        });
      }

      return recommendations.slice(0, 5); // Limit to top 5 recommendations

    } catch (error) {
      console.error('Error generating budget recommendations:', error);
      return [];
    }
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService; 