import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Shield, TrendingUp, Target, Bell, Smartphone, BarChart3, Wallet } from "lucide-react"
import Link from "next/link"
import { Carousel3D } from "@/components/ui/carousel-3d"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                FinanceFlow
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-lg px-6 py-3">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-lg px-8 py-3">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 3D Carousel Hero Section */}
      <section className="relative">
        <Carousel3D
          items={[
            {
              id: 1,
              title: "Smart Financial Dashboard",
              description:
                "Get a complete overview of your finances with real-time insights, spending patterns, and personalized recommendations all in one place.",
              image:
                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
              color: "#10b981",
            },
            {
              id: 2,
              title: "AI-Powered Expense Tracking",
              description:
                "Automatically categorize transactions with advanced AI, track every expense, and discover spending patterns you never knew existed.",
              image:
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2015&q=80",
              color: "#3b82f6",
            },
            {
              id: 3,
              title: "Smart Budget Management",
              description:
                "Set intelligent budgets, monitor spending limits in real-time, and receive proactive alerts before you overspend.",
              image:
                "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
              color: "#8b5cf6",
            },
            {
              id: 4,
              title: "Goal Achievement System",
              description:
                "Set ambitious financial goals, track progress with beautiful visualizations, and celebrate every milestone on your journey.",
              image:
                "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
              color: "#f59e0b",
            },
            {
              id: 5,
              title: "Advanced Analytics & Insights",
              description:
                "Receive personalized financial advice, detailed spending analysis, and actionable insights powered by cutting-edge AI technology.",
              image:
                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
              color: "#ef4444",
            },
            {
              id: 6,
              title: "Smart Notifications & Alerts",
              description:
                "Stay on top of your finances with intelligent notifications for budget limits, goal milestones, and spending patterns.",
              image:
                "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
              color: "#f59e0b",
            },
            {
              id: 7,
              title: "Investment Portfolio Tracking",
              description:
                "Monitor your investments, track portfolio performance, and make informed decisions with comprehensive market analysis.",
              image:
                "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
              color: "#8b5cf6",
            },
            {
              id: 8,
              title: "Multi-Currency Support",
              description:
                "Manage finances across multiple currencies with real-time exchange rates and automatic conversion for global users.",
              image:
                "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
              color: "#10b981",
            },
          ]}
          autoPlay={true}
          autoPlayInterval={4000}
        />
      </section>

      {/* Main Content Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Take Control of Your{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Financial Future
                </span>
              </h1>
              <p className="text-2xl text-gray-600 leading-relaxed max-w-5xl mx-auto">
                Experience the next generation of financial management with FinanceFlow. Track expenses, set budgets,
                achieve goals, and get AI-powered insights to make smarter financial decisions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-xl px-10 py-8 h-auto"
                >
                  Start Free Trial
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-xl px-10 py-8 h-auto bg-transparent border-2">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-12 text-lg text-gray-500">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6" />
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center space-x-3">
                <Smartphone className="w-6 h-6" />
                <span>Mobile & Web</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6" />
                <span>AI-Powered Insights</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-4xl md:text-5xl font-bold">Everything You Need to Manage Your Finances</h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto">
              From expense tracking to goal setting, FinanceFlow provides all the tools you need to achieve financial
              success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mb-6">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Smart Expense Tracking</CardTitle>
                <CardDescription className="text-lg">
                  Automatically categorize transactions with AI-powered insights and track spending patterns.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-6">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Budget Management</CardTitle>
                <CardDescription className="text-lg">
                  Set intelligent budgets and receive real-time alerts when you're approaching your limits.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Goal Achievement</CardTitle>
                <CardDescription className="text-lg">
                  Set financial goals and track your progress with beautiful visualizations and milestones.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-6">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Smart Notifications</CardTitle>
                <CardDescription className="text-lg">
                  Get intelligent alerts for budget limits, goal milestones, and spending patterns.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-6">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">AI Insights</CardTitle>
                <CardDescription className="text-lg">
                  Receive personalized financial advice and actionable insights powered by AI technology.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-6">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Multi-Platform</CardTitle>
                <CardDescription className="text-lg">
                  Access your finances anywhere with our mobile app and web platform.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Financial Life?
          </h2>
          <p className="text-2xl mb-10 opacity-90">
            Join thousands of users who are already taking control of their finances with FinanceFlow.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-gray-100 text-xl px-10 py-8 h-auto"
              >
                Get Started Free
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-emerald-600 text-xl px-10 py-8 h-auto"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">FinanceFlow</span>
              </div>
              <p className="text-lg text-gray-400">
                Empowering you to achieve financial freedom with AI-powered insights.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Product</h3>
              <ul className="space-y-3 text-lg text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Company</h3>
              <ul className="space-y-3 text-lg text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Support</h3>
              <ul className="space-y-3 text-lg text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-lg text-gray-400">
              © 2024 FinanceFlow. Made with ❤️ by Asadullah and Taimoor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
