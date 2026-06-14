"use client"

import type React from "react"
import { BarChart3, Menu, Wallet, X } from "lucide-react" // Import BarChart3

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  CreditCard,
  Car,
  ShoppingCart,
  GraduationCap,
  Coffee,
  Target,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Download,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"

const categoryIcons = {
  Food: ShoppingCart,
  Transport: Car,
  Education: GraduationCap,
  Extra: Coffee,
  Goal: Target,
  Income: TrendingUp,
}

const categoryColors = {
  Food: "bg-orange-500/20 text-orange-300 border-orange-400/30",
  Transport: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  Education: "bg-purple-500/20 text-purple-300 border-purple-400/30",
  Extra: "bg-pink-500/20 text-pink-300 border-pink-400/30",
  Goal: "bg-green-500/20 text-green-300 border-green-400/30",
  Income: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
}

export default function TransactionsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [dateRange, setDateRange] = useState("all")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const transactions = [
    {
      id: 1,
      description: "Whole Foods Market",
      amount: -85.5,
      category: "Food",
      date: "2024-01-15",
      time: "14:30",
      status: "completed",
      location: "Downtown Store",
      paymentMethod: "Credit Card",
    },
    {
      id: 2,
      description: "Monthly Salary",
      amount: 3500.0,
      category: "Income",
      date: "2024-01-14",
      time: "09:00",
      status: "completed",
      location: "Direct Deposit",
      paymentMethod: "Bank Transfer",
    },
    {
      id: 3,
      description: "Shell Gas Station",
      amount: -45.2,
      category: "Transport",
      date: "2024-01-13",
      time: "18:45",
      status: "completed",
      location: "Highway 101",
      paymentMethod: "Debit Card",
    },
    {
      id: 4,
      description: "Starbucks Coffee",
      amount: -12.75,
      category: "Food",
      date: "2024-01-12",
      time: "08:15",
      status: "completed",
      location: "Main Street",
      paymentMethod: "Mobile Pay",
    },
    {
      id: 5,
      description: "Udemy Course - React",
      amount: -99.0,
      category: "Education",
      date: "2024-01-11",
      time: "20:30",
      status: "pending",
      location: "Online",
      paymentMethod: "Credit Card",
    },
    {
      id: 6,
      description: "Emergency Fund Transfer",
      amount: -200.0,
      category: "Goal",
      date: "2024-01-10",
      time: "12:00",
      status: "completed",
      location: "Savings Account",
      paymentMethod: "Bank Transfer",
    },
    {
      id: 7,
      description: "Uber Ride",
      amount: -18.5,
      category: "Transport",
      date: "2024-01-09",
      time: "22:15",
      status: "completed",
      location: "City Center",
      paymentMethod: "Credit Card",
    },
    {
      id: 8,
      description: "Netflix Subscription",
      amount: -15.99,
      category: "Extra",
      date: "2024-01-08",
      time: "00:01",
      status: "completed",
      location: "Auto-renewal",
      paymentMethod: "Credit Card",
    },
  ]

  const monthlyStats = {
    totalIncome: 3500,
    totalExpenses: 477.74,
    netFlow: 3022.26,
    transactionCount: transactions.length,
    avgTransaction: 59.72,
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || transaction.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddDialogOpen(false)
    // Handle form submission
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
        {/* Enhanced Header */}
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
                <h1 className="text-3xl font-bold text-white">Transactions</h1>
                <p className="text-white/70">Manage and track all your financial transactions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20">
                  <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                    <DialogDescription>Record a new income or expense transaction</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddTransaction} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="e.g., Grocery shopping"
                        required
                        className="bg-white/50 border-white/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          required
                          className="bg-white/50 border-white/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select required>
                          <SelectTrigger className="bg-white/50 border-white/20">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select required>
                        <SelectTrigger className="bg-white/50 border-white/20">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Food">Food</SelectItem>
                          <SelectItem value="Transport">Transport</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Extra">Extra</SelectItem>
                          <SelectItem value="Goal">Goal</SelectItem>
                          <SelectItem value="Income">Income</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" required className="bg-white/50 border-white/20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input id="time" type="time" required className="bg-white/50 border-white/20" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location (Optional)</Label>
                      <Input id="location" placeholder="e.g., Downtown Store" className="bg-white/50 border-white/20" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select required>
                        <SelectTrigger className="bg-white/50 border-white/20">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">Credit Card</SelectItem>
                          <SelectItem value="debit">Debit Card</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mobile">Mobile Pay</SelectItem>
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
                        Add Transaction
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main Content - Full Width */}
        <main className="p-6 space-y-6 w-full">
          {/* Monthly Overview with Glass Effect */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Income</p>
                    <p className="text-2xl font-bold">${monthlyStats.totalIncome.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Expenses</p>
                    <p className="text-2xl font-bold">${monthlyStats.totalExpenses.toLocaleString()}</p>
                  </div>
                  <CreditCard className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Net Flow</p>
                    <p className="text-2xl font-bold">${monthlyStats.netFlow.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Transactions</p>
                    <p className="text-2xl font-bold text-white">{monthlyStats.transactionCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-purple-400/30">
                    <Upload className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Avg Transaction</p>
                    <p className="text-2xl font-bold text-white">${monthlyStats.avgTransaction}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-orange-400/30">
                    <BarChart3 className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Filters and Search */}
          <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Extra">Extra</SelectItem>
                      <SelectItem value="Goal">Goal</SelectItem>
                      <SelectItem value="Income">Income</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                      <Calendar className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="description">Description</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Transactions List */}
          <Card className="border-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Transaction History</CardTitle>
                  <CardDescription className="text-white/70">
                    {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} found
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 rounded-xl"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const IconComponent = categoryIcons[transaction.category as keyof typeof categoryIcons] || CreditCard
                  const colorClass =
                    categoryColors[transaction.category as keyof typeof categoryColors] ||
                    "bg-gray-500/20 text-gray-300 border-gray-400/30"

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-white/10 rounded-xl hover:bg-white/5 transition-all duration-200 group backdrop-blur-sm"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-sm ${colorClass}`}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{transaction.description}</h3>
                          <div className="flex items-center space-x-4 text-sm text-white/70">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{transaction.date}</span>
                            </div>
                            <span>{transaction.time}</span>
                            <Badge variant="secondary" className={`${colorClass} backdrop-blur-sm`}>
                              {transaction.category}
                            </Badge>
                            <span>•</span>
                            <span>{transaction.location}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-white/50 mt-1">
                            <span>{transaction.paymentMethod}</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              {transaction.status === "completed" ? (
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              ) : transaction.status === "pending" ? (
                                <Clock className="w-3 h-3 text-orange-400" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-red-400" />
                              )}
                              <span className="capitalize">{transaction.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div
                            className={`text-lg font-semibold ${
                              transaction.amount > 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                          <div className="flex items-center text-sm text-white/70">
                            <DollarSign className="w-3 h-3 mr-1" />
                            USD
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl">
                            <Eye className="w-4 h-4" />
                          </Button>
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
                  )
                })}
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No transactions found</h3>
                  <p className="text-white/70 mb-4">
                    {searchTerm || selectedCategory !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Start by adding your first transaction"}
                  </p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
