import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from './supabase';
import { AuthContext } from './_layout';

interface CategoryLimit {
  id: string;
  category_name: string;
  monthly_limit: number;
  is_active: boolean;
}

export default function CategoryBudgetLimitsScreen() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Default categories with suggested limits (excluding Income)
  const defaultCategories = [
    { name: 'Food', suggestedLimit: 15000, emoji: '🍕', color: '#FF6B6B' },
    { name: 'Transport', suggestedLimit: 12000, emoji: '🚗', color: '#4ECDC4' },
    { name: 'Education', suggestedLimit: 25000, emoji: '📚', color: '#45B7D1' },
    { name: 'Extra', suggestedLimit: 10000, emoji: '📦', color: '#96CEB4' },
    { name: 'Goal', suggestedLimit: 20000, emoji: '🎯', color: '#FFEAA7' },
  ];

  const fetchCategoryLimits = useCallback(async () => {
    try {
      if (!userId) return;

      const { data, error } = await supabase
        .from('category_budget_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('category_name');

      if (error) {
        console.error('Error fetching category limits:', error);
        Alert.alert('Error', 'Failed to load category limits');
        return;
      }

      setCategoryLimits(data || []);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load category limits');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCategoryLimits();
  }, [fetchCategoryLimits]);

  // Refresh when screen comes into focus (after editing)
  useFocusEffect(
    React.useCallback(() => {
      fetchCategoryLimits();
    }, [fetchCategoryLimits])
  );


  const getLimitForCategory = (categoryName: string): CategoryLimit | null => {
    return categoryLimits.find(limit => limit.category_name === categoryName) || null;
  };

  const toggleLimit = async (categoryName: string, suggestedLimit: number) => {
    if (saving) return;

    const existingLimit = getLimitForCategory(categoryName);
    
    if (existingLimit) {
      // Deactivate existing limit
      setSaving(categoryName);
      try {
        const { error } = await supabase
          .from('category_budget_limits')
          .update({ is_active: false })
          .eq('id', existingLimit.id);

        if (error) {
          console.error('Error deactivating limit:', error);
          Alert.alert('Error', 'Failed to remove limit');
          return;
        }

        setCategoryLimits(prev => prev.filter(l => l.id !== existingLimit.id));
        Alert.alert('Success', `Limit removed for ${categoryName}`);
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'Failed to remove limit');
      } finally {
        setSaving(null);
      }
    } else {
      // Create new limit - handle existing inactive records
      setSaving(categoryName);
      try {
        // First, check if there's an inactive record for this category
        const { data: existingInactive } = await supabase
          .from('category_budget_limits')
          .select('*')
          .eq('user_id', userId)
          .eq('category_name', categoryName)
          .eq('is_active', false)
          .single();

        if (existingInactive) {
          // Update existing inactive record
          const { data, error } = await supabase
            .from('category_budget_limits')
            .update({
              monthly_limit: suggestedLimit,
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingInactive.id)
            .select()
            .single();

          if (error) {
            console.error('Error updating limit:', error);
            Alert.alert('Error', 'Failed to create limit');
            return;
          }

          setCategoryLimits(prev => [...prev, data]);
        } else {
          // Create completely new record
          const { data, error } = await supabase
            .from('category_budget_limits')
            .insert({
              user_id: userId,
              category_name: categoryName,
              monthly_limit: suggestedLimit,
              is_active: true,
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating limit:', error);
            Alert.alert('Error', 'Failed to create limit');
            return;
          }

          setCategoryLimits(prev => [...prev, data]);
        }

        Alert.alert('Success', `Limit set for ${categoryName} (Rs ${suggestedLimit.toLocaleString()})`);
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'Failed to create limit');
      } finally {
        setSaving(null);
      }
    }
  };

  const navigateToEdit = (categoryName: string, currentLimit: number) => {
    router.push({
      pathname: '/edit_category_limit',
      params: {
        categoryName: categoryName,
        currentLimit: currentLimit.toString(),
      }
    });
  };

  const renderCategoryLimit = (category: { name: string; suggestedLimit: number; emoji: string; color: string }) => {
    const existingLimit = getLimitForCategory(category.name);
    const isActive = !!existingLimit;
    const isSaving = saving === category.name;

    return (
      <View key={category.name} style={[styles.categoryCard, { borderLeftColor: category.color, borderLeftWidth: 4 }]}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryLimit}>
              {isActive 
                ? `Rs ${existingLimit.monthly_limit.toLocaleString()}/month`
                : `Suggested: Rs ${category.suggestedLimit.toLocaleString()}/month`
              }
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Switch
                value={isActive}
                onValueChange={() => toggleLimit(category.name, category.suggestedLimit)}
                trackColor={{ false: '#e0e0e0', true: category.color }}
                thumbColor={isActive ? '#fff' : '#f4f3f4'}
                disabled={isSaving}
              />
            )}
          </View>
        </View>
        
        {isActive && (
          <View style={styles.activeIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.activeText}>Limit Active</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigateToEdit(category.name, existingLimit.monthly_limit)}
            >
              <Ionicons name="pencil" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading category limits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4f8cff', '#6a82fb', '#a18cd1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Ionicons name="wallet-outline" size={28} color="#fff" />
          </View>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Budget Limits</Text>
          <Text style={styles.headerSubtitle}>Smart spending control with alerts</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{categoryLimits.filter(l => l.is_active).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{defaultCategories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Set monthly spending limits for each category. You&apos;ll receive smart notifications when you approach or exceed these limits.
          </Text>
        </View>

        {defaultCategories.map(renderCategoryLimit)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    fontSize: 32,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  categoryLimit: {
    fontSize: 14,
    color: '#666',
  },
  toggleContainer: {
    marginLeft: 16,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  activeText: {
    fontSize: 14,
    color: '#28a745',
    marginLeft: 8,
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});