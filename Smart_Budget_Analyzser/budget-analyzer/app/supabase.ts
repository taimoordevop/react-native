import { Buffer } from 'buffer';
if (typeof global.Buffer === 'undefined') {
  // @ts-ignore
  global.Buffer = Buffer;
}
// Polyfill for structuredClone in React Native/Expo
import 'react-native-url-polyfill/auto';
if (typeof global.structuredClone === 'undefined') {
  // @ts-ignore
  global.structuredClone = require('structured-clone');
}
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase project credentials
const SUPABASE_URL = 'https://pvobxfklldflizhvayel.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2b2J4ZmtsbGRmbGl6aHZheWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTkxNjksImV4cCI6MjA2ODE3NTE2OX0.rztPYkFg4gVbh_3bUuPENmYCGiPVPxcK8qVnJECuwpE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- AUTHENTICATION ---

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

// --- EXAMPLE: CRUD QUERIES ---

// Example: Fetch all secrets for a user
export async function getSecrets(userId: string) {
  return supabase
    .from('secrets')
    .select('*')
    .eq('user_id', userId);
}

// Example: Add a new secret
export async function addSecret(userId: string, secret: string) {
  return supabase
    .from('secrets')
    .insert([{ user_id: userId, secret }]);
}

// Example: Delete a secret
export async function deleteSecret(secretId: string) {
  return supabase
    .from('secrets')
    .delete()
    .eq('id', secretId);
}

// Default export to fix route warning
export default supabase; 