import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Switch, StatusBar } from 'react-native';
import { supabase } from './supabase';
import { AuthContext } from './_layout';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const { setIsLoggedIn, setUserId, setUserEmail, setUserName } = useContext(AuthContext);

  const apiKey = 'AIzaSyBnzZAk3L0lgjYx5etjLXIl5s5RYGWhDdk';

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');
    setIsBiometricAvailable(compatible && enrolled);
    setIsBiometricEnabled(biometricEnabled === 'true');
  };

  const handleBiometricAuth = async () => {
    try {
      // Check if user has ever logged in before
      const savedUserId = await SecureStore.getItemAsync('userId');
      if (!savedUserId) {
        Alert.alert(
          'First Time Login Required',
          'Please login with your email and password first. After logging in, you can enable fingerprint login from Profile Settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if biometric is enabled
      const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');
      if (biometricEnabled !== 'true') {
        Alert.alert(
          'Fingerprint Login Disabled',
          'Please enable fingerprint login from Profile Settings after logging in with your credentials.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        const savedEmail = await SecureStore.getItemAsync('userEmail');
        const savedName = await SecureStore.getItemAsync('userName');

        setIsLoggedIn(true);
        setUserId(savedUserId);
        setUserEmail(savedEmail || undefined);
        setUserName(savedName || undefined);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      // Validate name
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter your name');
        setLoading(false);
        return;
      }

      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      // Add user to Supabase with better error handling
      const { error: supabaseError } = await supabase
        .from('users')
        .insert([{ id: data.localId, email, name: name.trim() }]);
      
      if (supabaseError) {
        console.error('Supabase insert error:', supabaseError);
        throw new Error(`Database error: ${supabaseError.message}`);
      }
      
      console.log('User successfully added to database:', data.localId);
      
      Alert.alert('Signup successful!');
      setIsSignUp(false);
      setIsLoggedIn(true);
      setUserId(data.localId);
      setUserEmail(email);
      setUserName(name.trim());
      
      // Only save login state if "Remember Me" is checked
      if (rememberMe) {
        await SecureStore.setItemAsync('isLoggedIn', 'true');
        await SecureStore.setItemAsync('userId', data.localId);
        await SecureStore.setItemAsync('userEmail', email);
        await SecureStore.setItemAsync('userName', name.trim());
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      Alert.alert('Error', err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      // Check if user exists in our database, if not add them
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('name')
        .eq('id', data.localId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', fetchError);
      }
      
      if (!existingUser) {
        // User doesn't exist in our database, add them
        const { error: insertError } = await supabase
          .from('users')
          .insert([{ id: data.localId, email }]);
        
        if (insertError) {
          console.error('Error adding user to database:', insertError);
          throw new Error(`Database error: ${insertError.message}`);
        }
        
        console.log('User successfully added to database during login:', data.localId);
      }
      
      setIsLoggedIn(true);
      setUserId(data.localId);
      setUserEmail(email);
      setUserName(existingUser?.name || undefined);
      
      // Only save login state if "Remember Me" is checked
      if (rememberMe) {
        await SecureStore.setItemAsync('isLoggedIn', 'true');
        await SecureStore.setItemAsync('userId', data.localId);
        await SecureStore.setItemAsync('userEmail', email);
        if (existingUser?.name) {
          await SecureStore.setItemAsync('userName', existingUser.name);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: resetEmail,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      Alert.alert('Password reset email sent!', 'Check your inbox for instructions.');
      setShowReset(false);
      setResetEmail('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send reset email');
      setResetLoading(false);
    }
  };

  // ── RESET PASSWORD SCREEN ──
  if (showReset) {
    return (
      <LinearGradient colors={['#1a237e', '#283593', '#7b1fa2']} style={styles.gradientBg}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.resetScrollContent} keyboardShouldPersistTaps="handled">

            {/* Back Arrow */}
            <TouchableOpacity onPress={() => setShowReset(false)} style={styles.resetBackArrow}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Lock Icon Circle */}
            <View style={styles.resetIconWrap}>
              <View style={styles.resetIconCircle}>
                <Ionicons name="lock-closed" size={72} color="#4f8cff" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.resetTitle}>Reset Password</Text>
            <Text style={styles.resetSubtitle}>
              Enter your email to receive reset{'\n'}instructions.
            </Text>

            {/* White Bottom Card */}
            <View style={styles.resetCard}>
              <View style={styles.resetInputRow}>
                <Ionicons name="mail" size={20} color="#636e72" style={styles.resetInputIcon} />
                <TextInput
                  style={styles.resetInput}
                  placeholder="Email"
                  placeholderTextColor="#b2bec3"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                />
              </View>

              <TouchableOpacity
                style={[styles.resetBtn, resetLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={resetLoading}
              >
                <Text style={styles.resetBtnText}>
                  {resetLoading ? 'Sending...' : 'Send Reset Email'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowReset(false)} style={styles.resetBackLink}>
                <Text style={styles.resetBackLinkText}>→  Back to Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ── SIGN UP SCREEN ──
  if (isSignUp) {
    return (
      <LinearGradient colors={['#0f0c29', '#1a1a5e', '#302b63']} style={styles.gradientBg}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.signupScrollContent} keyboardShouldPersistTaps="handled">

            {/* Glassmorphism Card */}
            <View style={styles.glassCard}>
              <Text style={styles.glassTitle}>Create{'\n'}Account</Text>
              <Text style={styles.glassSubtitle}>Sign up to get started</Text>

              {/* Full Name */}
              <View style={styles.glassInput}>
                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.glassIcon} />
                <TextInput
                  style={styles.glassTextField}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Email */}
              <View style={styles.glassInput}>
                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.glassIcon} />
                <TextInput
                  style={styles.glassTextField}
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <View style={styles.glassInput}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.glassIcon} />
                <TextInput
                  style={styles.glassTextField}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Switch
                  value={showPassword}
                  onValueChange={setShowPassword}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#4f8cff' }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#4f8cff', '#6a5acd']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtnGradient}
                >
                  <Text style={styles.primaryBtnText}>{loading ? 'Please wait...' : 'Sign Up'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.authFooter}>
              <Text style={styles.authFooterText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => setIsSignUp(false)}>
                <Text style={styles.authFooterLink}>Login</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ── LOGIN SCREEN ──
  return (
    <LinearGradient colors={['#0f0c29', '#1a1a5e', '#302b63']} style={styles.gradientBg}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.loginScrollContent} keyboardShouldPersistTaps="handled">

          {/* Logo Icon */}
          <View style={styles.logoWrap}>
            <Ionicons name="leaf" size={48} color="#4f8cff" />
          </View>

          {/* Heading */}
          <Text style={styles.loginTitle}>Welcome Back</Text>
          <Text style={styles.loginSubtitle}>Login to continue</Text>

          {/* Glassmorphism Input Card */}
          <View style={styles.loginInputCard}>
            {/* Email Row */}
            <View style={styles.loginInputRow}>
              <Ionicons name="mail" size={20} color="rgba(255,255,255,0.7)" style={styles.loginIcon} />
              <TextInput
                style={styles.loginTextField}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.45)"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View style={styles.inputSeparator} />
            {/* Password Row */}
            <View style={styles.loginInputRow}>
              <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.7)" style={styles.loginIcon} />
              <TextInput
                style={styles.loginTextField}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.45)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me + Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowReset(true)}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>{loading ? 'Please wait...' : 'Login'}</Text>
          </TouchableOpacity>

          {/* OR Divider + Fingerprint */}
          {isBiometricAvailable && isBiometricEnabled && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.fingerprintBtn} onPress={handleBiometricAuth}>
                <View style={styles.fingerprintCircle}>
                  <MaterialCommunityIcons name="fingerprint" size={44} color="#4f8cff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.fingerprintLabel}>
                Login with{'\n'}<Text style={styles.fingerprintBlue}>Fingerprint</Text>
              </Text>
            </>
          )}

          {/* Footer */}
          <View style={styles.authFooter}>
            <Text style={styles.authFooterText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => setIsSignUp(true)}>
              <Text style={styles.authFooterLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  keyboardView: { flex: 1, width: '100%' },

  // ── LOGIN ──
  loginScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 40,
    paddingHorizontal: 28,
  },
  logoWrap: {
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 36,
    textAlign: 'center',
  },
  loginInputCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  loginInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  loginIcon: { marginRight: 14 },
  loginTextField: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  inputSeparator: {
    height: 1,
    backgroundColor: '#4f8cff',
    marginHorizontal: 18,
    opacity: 0.5,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 5,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  checkboxChecked: {
    backgroundColor: '#4f8cff',
    borderColor: '#4f8cff',
  },
  rememberText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  forgotText: { fontSize: 14, color: '#4f8cff', fontWeight: '600' },
  loginBtn: {
    width: '100%',
    backgroundColor: '#4f8cff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  dividerLabel: {
    marginHorizontal: 14,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  fingerprintBtn: { marginBottom: 12 },
  fingerprintCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fingerprintLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  fingerprintBlue: { color: '#4f8cff' },

  // ── SIGN UP ──
  signupScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 28,
    marginBottom: 28,
  },
  glassTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 46,
  },
  glassSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 28,
  },
  glassInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassIcon: { marginRight: 12 },
  glassTextField: { flex: 1, fontSize: 16, color: '#fff' },
  primaryBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  primaryBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },

  // ── RESET PASSWORD ──
  resetScrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  resetBackArrow: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  resetIconWrap: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 10,
  },
  resetIconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  resetTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  resetSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 22,
  },
  resetCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  resetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resetInputIcon: { marginRight: 12 },
  resetInput: { flex: 1, fontSize: 16, color: '#2d3436' },
  resetBtn: {
    backgroundColor: '#4f8cff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  resetBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resetBackLink: { alignItems: 'center', paddingVertical: 8 },
  resetBackLinkText: { color: '#4f8cff', fontSize: 15, fontWeight: '600' },

  // ── SHARED ──
  authFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authFooterText: { fontSize: 14, color: 'rgba(255,255,255,0.65)' },
  authFooterLink: { fontSize: 14, color: '#4f8cff', fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.6 },
});