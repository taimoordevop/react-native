'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Loader2, ArrowLeft, Wallet } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const router = useRouter()
  const { login, resetPassword } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setError('')

    try {
      await resetPassword(resetEmail)
      setResetSuccess(true)
      setResetEmail('')
    } catch (err: any) {
      setError(err.message || 'Password reset failed')
    } finally {
      setResetLoading(false)
    }
  }

  if (showReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-8">
          {/* Back to Home */}
          <Link href="/" className="inline-flex items-center text-xl text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6 mr-3" />
            Back to Home
          </Link>

          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-9 h-9 text-white" />
              </div>
              <span className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                FinanceFlow
              </span>
            </div>
          </div>

          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-4xl font-bold">Reset Password</CardTitle>
              <CardDescription className="text-xl">
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {resetSuccess ? (
                <Alert className="mb-8">
                  <AlertDescription className="text-xl">
                    Password reset email sent! Check your inbox and follow the instructions.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-8">
                  <div className="space-y-4">
                    <Label htmlFor="reset-email" className="text-xl">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="h-16 text-xl px-6"
                      required
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xl">{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full h-16 text-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" disabled={resetLoading}>
                    {resetLoading && <Loader2 className="mr-4 h-6 w-6 animate-spin" />}
                    Send Reset Link
                  </Button>
                </form>
              )}
              <div className="mt-8 text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowReset(false)
                    setError('')
                    setResetSuccess(false)
                  }}
                  className="text-xl"
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Back to Home */}
        <Link href="/" className="inline-flex items-center text-xl text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6 mr-3" />
          Back to Home
        </Link>

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-9 h-9 text-white" />
            </div>
            <span className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              FinanceFlow
            </span>
          </div>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-xl">
              Sign in to your account to continue managing your finances
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-4">
                <Label htmlFor="email" className="text-xl">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-16 text-xl px-6"
                  required
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="password" className="text-xl">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-16 text-xl px-6 pr-16"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-16 px-6 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-6 w-6" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="w-6 h-6"
                  />
                  <Label htmlFor="remember" className="text-xl">
                    Remember me
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowReset(true)}
                  className="text-emerald-600 hover:text-emerald-700 text-xl"
                >
                  Forgot password?
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xl">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-16 text-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-4 h-6 w-6 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-xl text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
