import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from './supabase';
import { AuthContext, CurrencyContext } from './_layout';
import { Ionicons } from '@expo/vector-icons';
import NotificationService from './services/NotificationService';

export default function AddMoneyScreen() {
  const { userId } = useContext(AuthContext);
  const { currency, getCurrencySymbol } = useContext(CurrencyContext);
  const router = useRouter();
  const params = useLocalSearchParams();
  const goalId = params.goalId as string;
  const goalName = params.goalName as string;
  const currentAmount = parseFloat(params.currentAmount as string) || 0;
  const targetAmount = parseFloat(params.targetAmount as string) || 0;
  const dueDate = params.dueDate as string;
  const goalIcon = params.goalIcon as string;
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const addAmount = parseFloat(amount);
    
    try {
      setLoading(true);

      // 1. Update the goal's current_amount
      const newCurrentAmount = currentAmount + addAmount;
      
      const { error: goalError } = await supabase
        .from('goals')
        .update({ current_amount: newCurrentAmount })
        .eq('id', goalId)
        .eq('user_id', userId);

      if (goalError) {
        console.error('Error updating goal:', goalError);
        Alert.alert('Error', 'Failed to update goal');
        return;
      }

      // 2. Create a transaction (expense) for the goal contribution
      // First, find or create a "Goals" category
      let { data: goalsCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Goals')
        .single();
      
      if (!goalsCategory) {
        // Create Goals category if it doesn't exist
        const { data: newGoalsCategory } = await supabase
          .from('categories')
          .insert([{ name: 'Goals' }])
          .select('id')
          .single();
        goalsCategory = newGoalsCategory;
      }

      const transactionData = {
        user_id: userId,
        amount: -addAmount, // Negative amount (expense)
        date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`, // Fixed: Timezone-safe date formatting
        category_id: goalsCategory?.id || null,
        description: `Goal: ${goalName}`,
        notes: `Contribution to ${goalName} goal`,
      };

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        // Even if transaction fails, goal was updated, so we'll continue
      }

      // Fire goal progress / achievement notifications
      const newProgress = Math.round((newCurrentAmount / targetAmount) * 100);
      const oldProgress = Math.round((currentAmount / targetAmount) * 100);

      if (newCurrentAmount >= targetAmount) {
        await NotificationService.scheduleGoalAchievement(goalId, goalName);
      } else {
        for (const milestone of [25, 50, 75]) {
          if (oldProgress < milestone && newProgress >= milestone) {
            await NotificationService.scheduleGoalProgressCelebration(goalId, goalName, milestone);
            break;
          }
        }
      }

      // Success
      Alert.alert(
        'Success',
        `Added ${getCurrencySymbol(currency)}${addAmount.toLocaleString()} to ${goalName}`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = currentAmount / targetAmount;
  const progressPercentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>⟵</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Add Money to Goal</Text>
          <Text style={styles.subtitle}>Contribute to your financial objective</Text>
        </View>
      </View>

      {/* Goal Info Card */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalIconContainer}>
            <Ionicons name={goalIcon as any} size={24} color="#fff" />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalName}>{goalName}</Text>
            <Text style={styles.goalProgress}>
              {getCurrencySymbol(currency)}{currentAmount.toLocaleString()} / {getCurrencySymbol(currency)}{targetAmount.toLocaleString()}
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${Math.min(progressPercentage, 100)}%` }
            ]} 
          />
        </View>
        
        <Text style={styles.progressText}>{progressPercentage}% complete</Text>
        <Text style={styles.dueDate}>Due: {new Date(dueDate).toLocaleDateString()}</Text>
      </View>

      {/* Amount Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount to Add</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="wallet" size={20} color="#666" />
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor="#b2bec3"
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>
      </View>

      {/* Add Money Button */}
      <TouchableOpacity 
        style={[styles.addButton, loading && styles.addButtonDisabled]} 
        onPress={handleAddMoney}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.addButtonText}>Add Money</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 30,
  },
  backText: {
    fontSize: 30,
    color: '#222',
    fontWeight: 'bold',
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIconContainer: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  goalProgress: {
    fontSize: 16,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 15,
    paddingHorizontal: 10,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#a5a5a5',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});