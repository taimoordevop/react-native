'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  Plus, 
  LogOut,
  BarChart3,
  PieChart,
  DollarSign,
  Calendar
} from 'lucide-react'
import type { Transaction, Goal, Category } from '@/lib/supabase'

export default function DashboardPage() {
  const { user, isLoggedIn, logout } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth/login')
    }
  }, [isLoggedIn, router])

  // Fetch user data
  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })

      if (transactionError) throw transactionError
      setTransactions(transactionData || [])

      // Fetch goals
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (goalError) throw goalError
      setGoals(goalData || [])

      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_deleted', false)

      if (categoryError) {
        console.log('Category error:', categoryError)
        // Set default categories if fetch fails
        setCategories([
          { id: '1', name: 'Food', user_id: user!.id, is_deleted: false, created_at: new Date().toISOString() },
          { id: '2', name: 'Transport', user_id: user!.id, is_deleted: false, created_at: new Date().toISOString() },
          { id: '3', name: 'Education', user_id: user!.id, is_deleted: false, created_at: new Date().toISOString() },
          { id: '4', name: 'Goals', user_id: user!.id, is_deleted: false, created_at: new Date().toISOString() },
          { id: '5', name: 'Extra', user_id: user!.id, is_deleted: false, created_at: new Date().toISOString() }
        ])
      } else {
        setCategories(categoryData || [])
      }

      // Calculate totals
      const income = transactionData?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0
      const expenses = transactionData?.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0
      const currentBalance = income - expenses

      setTotalIncome(income)
      setTotalExpenses(expenses)
      setBalance(currentBalance)

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const getAISpendingScore = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
    })
    
    const currentMonthExpenses = currentMonthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const currentMonthIncome = currentMonthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    
    const spendingRatio = currentMonthIncome > 0 ? (currentMonthExpenses / currentMonthIncome) : 1
    
    let score = 50
    
    if (currentMonthIncome === 0 && currentMonthExpenses === 0) {
      score = 50
    } else if (currentMonthIncome === 0 && currentMonthExpenses > 0) {
      score = 20
    } else if (spendingRatio > 0.9) score = 25
    else if (spendingRatio > 0.8) score = 35
    else if (spendingRatio > 0.7) score = 50
    else if (spendingRatio > 0.6) score = 65
    else if (spendingRatio > 0.5) score = 75
    else score = 85
    
    const savingsRate = currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) : 0
    
    if (savingsRate > 0.4) score += 10
    else if (savingsRate > 0.3) score += 8
    else if (savingsRate > 0.2) score += 5
    else if (savingsRate > 0.1) score += 2
    
    if (savingsRate < 0.05) score -= 15
    else if (savingsRate < 0.1) score -= 10
    
    const largeTransactions = currentMonthTransactions.filter(t => Math.abs(t.amount) > 2000).length
    if (largeTransactions === 0) score += 5
    else if (largeTransactions <= 2) score += 2
    else if (largeTransactions > 5) score -= 5
    
    const incomeTransactions = currentMonthTransactions.filter(t => t.amount > 0).length
    if (incomeTransactions >= 2) score += 3
    
    return Math.min(100, Math.max(0, Math.round(score)))
  }

  const getAICategoryInsights = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
    })
    
    const expenses = currentMonthTransactions.filter(t => t.amount < 0)
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    if (totalExpenses === 0) {
      return { 
        topCategory: 'No expenses', 
        percentage: 0, 
        amount: 0,
        trend: 'neutral',
        insight: 'No spending this month'
      }
    }
    
    const categoryTotals: { [key: string]: number } = {}
    
    expenses.forEach(t => {
      let categoryName = 'Unknown'
      
      const category = categories.find(c => c.id === t.category_id)
      if (category) {
        categoryName = category.name
      } else {
        // Amount-based fallback categorization
        const amount = Math.abs(t.amount)
        if (amount < 100) {
          categoryName = 'Food'
        } else if (amount < 500) {
          categoryName = 'Transport'
        } else if (amount < 2000) {
          categoryName = 'Extra'
        } else {
          categoryName = 'Goals'
        }
      }
      
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Math.abs(t.amount)
    })
    
    if (Object.keys(categoryTotals).length === 0) {
      return {
        topCategory: 'No expenses',
        percentage: 0,
        amount: 0,
        trend: 'neutral',
        insight: 'No spending this month'
      }
    }
    
    const sortedCategories = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)
    const [topCategory, topAmount] = sortedCategories[0]
    const percentage = Math.round((topAmount / totalExpenses) * 100)
    
    return {
      topCategory,
      percentage,
      amount: topAmount,
      trend: 'up',
      insight: `Highest spending category`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    )
  }

  const aiScore = getAISpendingScore()
  const categoryInsights = getAICategoryInsights()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                FinanceFlow
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Total Balance</span>
                  <Wallet className="w-6 h-6" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-300" />
                    <span className="text-sm">Income: ${totalIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-red-300" />
                    <span className="text-sm">Expenses: ${totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Spending Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                    <span>AI Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{aiScore}</div>
                  <Progress value={aiScore} className="mb-2" />
                  <p className="text-sm text-gray-600">
                    {aiScore >= 85 ? 'Excellent' : aiScore >= 70 ? 'Good' : aiScore >= 50 ? 'Fair' : 'Needs Work'}
                  </p>
                </CardContent>
              </Card>

              {/* Top Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-blue-500" />
                    <span>Top Category</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{categoryInsights.percentage}%</div>
                  <p className="text-sm text-gray-600 mb-2">{categoryInsights.topCategory}</p>
                  <p className="text-xs text-gray-500">${categoryInsights.amount.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Transactions</span>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}${transaction.amount.toLocaleString()}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {categories.find(c => c.id === transaction.category_id)?.name || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Goals & Quick Actions */}
          <div className="space-y-6">
            {/* Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  <span>Financial Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No goals set yet</p>
                ) : (
                  <div className="space-y-4">
                    {goals.slice(0, 3).map((goal) => {
                      const progress = (goal.current_amount / goal.target_amount) * 100
                      return (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{goal.name}</p>
                              <p className="text-sm text-gray-600">
                                ${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline">{Math.round(progress)}%</Badge>
                          </div>
                          <Progress value={progress} />
                        </div>
                      )
                    })}
                  </div>
                )}
                <Button className="w-full mt-4" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
                <Button className="w-full" variant="outline">
                  <Target className="w-4 h-4 mr-2" />
                  Set Goal
                </Button>
                <Button className="w-full" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
