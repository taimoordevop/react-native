'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { auth } from './firebase'
import { supabase } from './supabase'
import { FIREBASE_SIGNUP_URL, FIREBASE_SIGNIN_URL } from './firebase'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for stored authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('financeflow_user')
        const storedToken = localStorage.getItem('financeflow_token')
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(FIREBASE_SIGNIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error.message)

      // Get user data from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.localId)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        throw new Error('User not found in database')
      }

      const user = {
        id: data.localId,
        email: email,
        name: userData?.name || email.split('@')[0]
      }

      setUser(user)
      localStorage.setItem('financeflow_user', JSON.stringify(user))
      localStorage.setItem('financeflow_token', data.idToken)
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(FIREBASE_SIGNUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error.message)

      // Add user to Supabase
      const { error: supabaseError } = await supabase
        .from('users')
        .insert([{ id: data.localId, email, name: name.trim() }])

      if (supabaseError) {
        console.error('Supabase insert error:', supabaseError)
        throw new Error(`Database error: ${supabaseError.message}`)
      }

      const user = {
        id: data.localId,
        email: email,
        name: name.trim()
      }

      setUser(user)
      localStorage.setItem('financeflow_user', JSON.stringify(user))
      localStorage.setItem('financeflow_token', data.idToken)
    } catch (error: any) {
      console.error('Signup error:', error)
      throw new Error(error.message || 'Signup failed')
    }
  }

  const logout = async () => {
    try {
      setUser(null)
      localStorage.removeItem('financeflow_user')
      localStorage.removeItem('financeflow_token')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email,
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error.message)
    } catch (error: any) {
      console.error('Password reset error:', error)
      throw new Error(error.message || 'Password reset failed')
    }
  }

  const value = {
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    signup,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
