'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, ArrowLeft, Wallet } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const { signup } = useAuth()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!name.trim()) {
      setError('Please enter your name')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      await signup(email, password, name)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
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
            <CardTitle className="text-4xl font-bold">Create Account</CardTitle>
            <CardDescription className="text-xl">
              Join FinanceFlow to start managing your finances with AI-powered insights
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSignup} className="space-y-8">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-xl">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-16 text-xl px-6"
                  required
                />
              </div>
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
                    placeholder="Create a password"
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
              <div className="space-y-4">
                <Label htmlFor="confirm-password" className="text-xl">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-16 text-xl px-6 pr-16"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-16 px-6 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-6 w-6" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </Button>
                </div>
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
                Create Account
              </Button>
            </form>
            <div className="mt-10 text-center">
              <p className="text-xl text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
