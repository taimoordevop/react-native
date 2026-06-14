"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Wallet,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings,
  Calendar,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  ShoppingCart,
  Car,
  GraduationCap,
  Coffee,
  Home,
  Gamepad2,
  Menu,
  X,
} from "lucide-react"

const categoryIcons = {
  Food: ShoppingCart,
  Transport: Car,
  Education: GraduationCap,
  Entertainment: Coffee,
  Housing: Home,
  Healthcare: Target,
  Shopping: ShoppingCart,
  Utilities: Settings,
  Gaming: Gamepad2,
}

const categoryColors = {
  Food: "from-orange-500 to-red-500",
  Transport: "from-blue-500 to-cyan-500",
  Education: "from-purple-500 to-pink-500",
  Entertainment: "from-green-500 to-emerald-500",
  Housing: "from-indigo-500 to-purple-500",
  Healthcare: "from-red-500 to-pink-500",
  Shopping: "from-yellow-500 to-orange-500",
  Utilities: "from-gray-500 to-slate-500",
  Gaming: "from-violet-500 to-purple-500",
}

export default function BudgetsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const budgetCategories = [
    {
      id: 1,
      name: "Food",
      spent: 450,
      limit: 600,
      progress: 75,
      trend: "up",
      change: 12,
      transactions: 23,
      avgTransaction: 19.57,
      lastTransaction: "2 hours ago",
      status: "warning",
    },
    {
      id: 2,
      name: "Transport",
      spent: 180,
      limit: 300,
      progress: 60,
      trend: "down",
      change: -8,
      transactions: 12,
      avgTransaction: 15.0,
      lastTransaction: "1 day ago",
      status: "good",
    },
    {
      id: 3,
      name: "Entertainment",
      spent: 120,
      limit: 200,
      progress: 60,
      trend: "up",
      change: 15,
      transactions: 8,
      avgTransaction: 15.0,
      lastTransaction: "3 days ago",
      status: "good",
    },
    {
      id: 4,
      name: "Education",
      spent: 99,
      limit: 150,
      progress: 66,
      trend: "up",
      change: 25,
      transactions: 3,
      avgTransaction: 33.0,
      lastTransaction: "5 days ago",
      status: "good",
    },
    {
      id: 5,
      name: "Shopping",
      spent: 320,
      limit: 400,
      progress: 80,
      trend: "up",
      change: 18,
      transactions: 15,
      avgTransaction: 21.33,
      lastTransaction: "1 day ago",
      status: "warning",
    },
    {
      id: 6,
      name: "Healthcare",
      spent: 85,
      limit: 200,
      progress: 42.5,
      trend: "down",
      change: -5,
      transactions: 4,
      avgTransaction: 21.25,
      lastTransaction: "1 week ago",
      status: "good",
    },
  ]

  const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.limit, 0)
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overallProgress = (totalSpent / totalBudget) * 100

  const budgetStats = {
    totalBudget,
    totalSpent,
    totalRemaining,
    overallProgress,
    categoriesOverBudget: budgetCategories.filter((cat) => cat.progress > 100).length,
    categoriesAtRisk: budgetCategories.filter((cat) => cat.progress > 80 && cat.progress <= 100).length,
    avgSpendingPerCategory: totalSpent / budgetCategories.length,
  }

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar Overlay - Only shows when open */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/20 transform transition-transform duration-300 ease-out">
            <div className="flex items-center justify-between p-6 border-b border-gradient-to-r from-emerald-500/20 to-teal-500/20 bg-gradient-to-r from-emerald-500 to-teal-500">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">FinanceFlow</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-xl"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            {/* Add navigation content here */}
          </div>
        </>
      )}

      {/* Main Content - Full Width */}
      <div className="w-full">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Budget Management</h1>
                <p className="text-white/70">Track and manage your spending limits across categories</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Budget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20">
                  <DialogHeader>
                    <DialogTitle>Create New Budget</DialogTitle>
                    <DialogDescription>Set a spending limit for a category</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddBudget} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select required>
                        <SelectTrigger className="bg-white/50 border-white/20">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Food">Food & Dining</SelectItem>
                          <SelectItem value="Transport">Transportation</SelectItem>
                          <SelectItem value="Entertainment">Entertainment</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Shopping">Shopping</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Housing">Housing</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="limit">Budget Limit</Label>
                      <Input
                        id="limit"
                        type="number"
                        step="0.01"
                        placeholder="500.00"
                        required
                        className="bg-white/50 border-white/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="period">Period</Label>
                      <Select required>
                        <SelectTrigger className="bg-white/50 border-white/20">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                      <Select>
                        <SelectTrigger className="bg-white/50 border-white/20">
                          <SelectValue placeholder="80%" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50%</SelectItem>
                          <SelectItem value="70">70%</SelectItem>
                          <SelectItem value="80">80%</SelectItem>
                          <SelectItem value="90">90%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 bg-white/10 border-white/20"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      >
                        Create Budget
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main Content - Full Width */}
        <main className="p-6 space-y-8 w-full">
          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Budget</p>
                    <p className="text-3xl font-bold">${budgetStats.totalBudget.toLocaleString()}</p>
                  </div>
                  <Wallet className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Spent</p>
                    <p className="text-3xl font-bold">${budgetStats.totalSpent.toLocaleString()}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Remaining</p>
                    <p className="text-3xl font-bold">${budgetStats.totalRemaining.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Overall Progress</p>
                    <p className="text-3xl font-bold text-white">{budgetStats.overallProgress.toFixed(1)}%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-purple-400/30">
                    <PieChart className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Categories Over Budget</p>
                    <p className="text-2xl font-bold text-red-400">{budgetStats.categoriesOverBudget}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-400/30">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Categories at Risk</p>
                    <p className="text-2xl font-bold text-orange-400">{budgetStats.categoriesAtRisk}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-orange-400/30">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Avg per Category</p>
                    <p className="text-2xl font-bold text-white">${budgetStats.avgSpendingPerCategory.toFixed(0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-400/30">
                    <BarChart3 className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Categories Grid */}
          <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Budget Categories</CardTitle>
                  <CardDescription className="text-white/70">
                    Monitor your spending across different categories
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 rounded-xl"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {budgetCategories.map((category) => {
                  const IconComponent = categoryIcons[category.name as keyof typeof categoryIcons] || Wallet
                  const gradientClass =
                    categoryColors[category.name as keyof typeof categoryColors] || "from-gray-500 to-slate-500"

                  return (
                    <div
                      key={category.id}
                      className="p-6 border border-white/20 rounded-xl hover:bg-white/5 transition-all duration-200 group backdrop-blur-sm"
                    >
                      <div className="space-y-4">
                        {/* Category Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-r ${gradientClass} flex items-center justify-center shadow-lg`}
                            >
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-white">{category.name}</h3>
                              <p className="text-sm text-white/70">{category.transactions} transactions</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={category.status === "warning" ? "destructive" : "secondary"}
                              className={
                                category.status === "warning"
                                  ? "bg-orange-500/20 text-orange-300 border-orange-400/30"
                                  : "bg-white/10 text-white border-white/20"
                              }
                            >
                              {category.progress.toFixed(0)}%
                            </Badge>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-white">${category.spent} spent</span>
                            <span className="text-white/70">of ${category.limit}</span>
                          </div>
                          <Progress
                            value={Math.min(category.progress, 100)}
                            className={`h-3 bg-white/10 ${category.progress > 100 ? "bg-red-500/20" : ""}`}
                          />
                          {category.progress > 100 && (
                            <div className="flex items-center text-xs text-red-400">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Over budget by ${(category.spent - category.limit).toFixed(2)}
                            </div>
                          )}
                        </div>

                        {/* Category Stats */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                          <div>
                            <p className="text-xs text-white/70">Trend</p>
                            <div
                              className={`flex items-center text-sm font-medium ${category.trend === "up" ? "text-red-400" : "text-green-400"}`}
                            >
                              {category.trend === "up" ? (
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3 mr-1" />
                              )}
                              {Math.abs(category.change)}%
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-white/70">Avg Transaction</p>
                            <p className="text-sm font-medium text-white">${category.avgTransaction.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/70">Remaining</p>
                            <p
                              className={`text-sm font-medium ${category.limit - category.spent < 0 ? "text-red-400" : "text-green-400"}`}
                            >
                              ${Math.max(0, category.limit - category.spent).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/70">Last Activity</p>
                            <p className="text-sm font-medium text-white">{category.lastTransaction}</p>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 rounded-xl"
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 rounded-xl"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Expense
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Budget Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Budget Insights</CardTitle>
                <CardDescription className="text-white/70">
                  AI-powered recommendations for your spending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-500/20 border border-orange-400/30 rounded-lg backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-300">Food Budget Alert</h4>
                        <p className="text-sm text-orange-200 mt-1">
                          You've spent 75% of your food budget. Consider meal planning to stay within limits.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-500/20 border border-green-400/30 rounded-lg backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-300">Great Progress!</h4>
                        <p className="text-sm text-green-200 mt-1">
                          Your transport spending is down 8% this month. Keep up the good work!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <Target className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-300">Optimization Tip</h4>
                        <p className="text-sm text-blue-200 mt-1">
                          You could save $50/month by reducing entertainment expenses by 25%.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Spending Trends</CardTitle>
                <CardDescription className="text-white/70">Your spending patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-8 border-2 border-dashed border-white/20 rounded-lg backdrop-blur-sm">
                    <BarChart3 className="w-12 h-12 text-white/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Spending Chart</h3>
                    <p className="text-white/70 mb-4">Visual representation of your spending trends will appear here</p>
                    <Button
                      variant="outline"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 rounded-xl"
                    >
                      View Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
