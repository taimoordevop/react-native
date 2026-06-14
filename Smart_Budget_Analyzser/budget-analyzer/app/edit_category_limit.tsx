import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from './supabase';
import { AuthContext } from './_layout';

export default function EditCategoryLimitScreen() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  const params = useLocalSearchParams();
  const initialized = useRef(false);
  
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [currentLimit, setCurrentLimit] = useState(0);

  useEffect(() => {
    if (params.categoryName && params.currentLimit && !initialized.current) {
      setCategoryName(params.categoryName as string);
      setCurrentLimit(parseInt(params.currentLimit as string));
      setAmount(params.currentLimit as string);
      initialized.current = true;
    }
  }, [params]);

  const handleSave = async () => {
    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Get the current limit record
      const { data: currentLimitData, error: fetchError } = await supabase
        .from('category_budget_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('category_name', categoryName)
        .eq('is_active', true)
        .single();

      if (fetchError || !currentLimitData) {
        Alert.alert('Error', 'Limit not found');
        return;
      }

      // Update the limit
      const { error: updateError } = await supabase
        .from('category_budget_limits')
        .update({
          monthly_limit: parseFloat(amount),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentLimitData.id);

      if (updateError) {
        console.error('Error updating limit:', updateError);
        Alert.alert('Error', 'Failed to update limit');
        return;
      }

      Alert.alert(
        'Success', 
        `Limit updated to Rs ${parseFloat(amount).toLocaleString()}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to update limit');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const getCategoryEmoji = (name: string) => {
    const emojis: { [key: string]: string } = {
      'Food': '🍕',
      'Transport': '🚗',
      'Education': '📚',
      'Extra': '📦',
      'Goal': '🎯',
    };
    return emojis[name] || '💰';
  };

  const getCategoryColor = (name: string) => {
    const colors: { [key: string]: string } = {
      'Food': '#FF6B6B',
      'Transport': '#4ECDC4',
      'Education': '#45B7D1',
      'Extra': '#96CEB4',
      'Goal': '#FFEAA7',
    };
    return colors[name] || '#007AFF';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Limit</Text>
          <Text style={styles.headerSubtitle}>{categoryName}</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Category Info Card */}
        <View style={[styles.categoryCard, { borderLeftColor: getCategoryColor(categoryName), borderLeftWidth: 4 }]}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryEmoji}>{getCategoryEmoji(categoryName)}</Text>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{categoryName}</Text>
              <Text style={styles.currentLimit}>
                Current: Rs {currentLimit.toLocaleString()}/month
              </Text>
            </View>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>New Monthly Limit</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
            autoFocus
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  currentLimit: {
    fontSize: 16,
    color: '#666',
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  amountInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
}); 