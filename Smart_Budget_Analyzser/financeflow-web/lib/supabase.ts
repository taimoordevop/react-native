import { createClient } from '@supabase/supabase-js'

// Use environment variables or fallback to the same credentials as React Native app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pvobxfklldflizhvayel.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2b2J4ZmtsbGRmbGl6aHZheWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTkxNjksImV4cCI6MjA2ODE3NTE2OX0.rztPYkFg4gVbh_3bUuPENmYCGiPVPxcK8qVnJECuwpE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Transaction {
  id: string
  user_id: string
  amount: number
  description: string
  category_id: string
  date: string
  created_at: string
  notes?: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  due_date: string
  due_time?: string
  created_at: string
  description?: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  is_deleted: boolean
  created_at: string
}

export interface CategoryBudgetLimit {
  id: string
  user_id: string
  category_name: string
  monthly_limit: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
  full_name?: string
  avatar_url?: string
}

// Authentication functions (using Firebase, not Supabase auth)
export async function signUp(email: string, password: string) {
  // This will be handled by Firebase, not Supabase
  throw new Error('Use Firebase authentication for sign up')
}

export async function signIn(email: string, password: string) {
  // This will be handled by Firebase, not Supabase
  throw new Error('Use Firebase authentication for sign in')
}

export async function signOut() {
  // This will be handled by Firebase, not Supabase
  throw new Error('Use Firebase authentication for sign out')
}
