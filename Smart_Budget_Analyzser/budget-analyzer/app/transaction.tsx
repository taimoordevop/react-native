import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from './supabase';
import { AuthContext, CurrencyContext } from './_layout';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Add Transaction type for clarity
type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  category_id: string;
  description: string;
  notes: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  category?: { name: string } | string | null;
};

export default function TransactionScreen() {
  const { userId } = useContext(AuthContext) as { userId: string };
  const { currency, getCurrencySymbol } = useContext(CurrencyContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'expenses' | 'income'>('all');
  const [sortAsc, setSortAsc] = useState(false);
  const router = useRouter();

  // Calculate real values from transactions
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
  const net = totalIncome + totalExpenses;

  // Filter transactions by search and tab
  const filteredTransactions = transactions
    .filter(t =>
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      String(t.amount).includes(search)
    )
    .filter(t =>
      tab === 'all' ? true : tab === 'expenses' ? t.amount < 0 : t.amount > 0
    )
    .sort((a, b) => sortAsc ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group transactions by date
  const groupedByDate = filteredTransactions.reduce((acc: Record<string, Transaction[]>, tx) => {
    const date = tx.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {});
  const groupedDates = Object.keys(groupedByDate).sort((a, b) => 
    sortAsc ? new Date(a).getTime() - new Date(b).getTime() : new Date(b).getTime() - new Date(a).getTime()
  );

  const handleEdit = (id: string) => {
    // Find the transaction to edit
    const transactionToEdit = transactions.find(t => t.id === id);
    if (!transactionToEdit) {
      Alert.alert('Error', 'Transaction not found');
      return;
    }

    // Navigate to add transaction screen with edit mode and pre-filled data
    router.push({
      pathname: '/add_transaction',
      params: {
        mode: 'edit',
        transactionId: id,
        amount: Math.abs(transactionToEdit.amount).toString(),
        description: transactionToEdit.description || '',
        notes: transactionToEdit.notes || '',
        date: transactionToEdit.date,
        category: typeof transactionToEdit.category === 'object' && transactionToEdit.category !== null 
          ? transactionToEdit.category.name 
          : (typeof transactionToEdit.category === 'string' ? transactionToEdit.category : ''),
        transactionType: transactionToEdit.amount > 0 ? 'income' : 'expense'
      }
    });
  };
  const handleDelete = async (id: string) => {
    console.log('Delete button pressed for transaction ID:', id);
    
    // Show confirmation dialog
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('User confirmed deletion for transaction ID:', id);
            try {
              // First, get the transaction details to check if it's a goal transaction
              const { data: transactionToDelete } = await supabase
                .from('transactions')
                .select('*, category:categories(name)')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

              if (!transactionToDelete) {
                Alert.alert('Error', 'Transaction not found');
                return;
              }

              console.log('Transaction to delete:', {
                id: transactionToDelete.id,
                amount: transactionToDelete.amount,
                category: transactionToDelete.category,
                description: transactionToDelete.description,
                notes: transactionToDelete.notes
              });

              // Check if this is a goal transaction
              const isGoalTransaction = transactionToDelete.amount < 0 && 
                typeof transactionToDelete.category === 'object' && 
                transactionToDelete.category?.name === 'Goals';

              console.log('Goal transaction check:', {
                isGoalTransaction,
                amount: transactionToDelete.amount,
                categoryType: typeof transactionToDelete.category,
                categoryName: transactionToDelete.category?.name
              });

              // Permanently delete the transaction
              const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

              if (error) {
                console.error('Error deleting transaction:', error);
                Alert.alert('Error', 'Failed to delete transaction. Please try again.');
                return;
              }

              // If this was a goal transaction, update the goal's current_amount
              if (isGoalTransaction) {
                const goalAmount = Math.abs(transactionToDelete.amount); // Convert negative to positive
                
                // Extract goal name from transaction description
                let goalName = transactionToDelete.description.trim();
                if (goalName.startsWith('Goal: ')) {
                  goalName = goalName.substring(6); // Remove "Goal: " prefix
                }

                console.log('Goal deletion details:', {
                  goalAmount,
                  originalDescription: transactionToDelete.description,
                  extractedGoalName: goalName
                });

                // Find and update the goal
                const { data: goal } = await supabase
                  .from('goals')
                  .select('id, current_amount')
                  .eq('user_id', userId)
                  .eq('name', goalName)
                  .single();

                if (goal) {
                  // Subtract the deleted amount from goal's current_amount
                  const newCurrentAmount = goal.current_amount - goalAmount;
                  console.log('Updating goal after deletion:', {
                    goalId: goal.id,
                    goalName: goalName,
                    currentAmount: goal.current_amount,
                    deletedAmount: goalAmount,
                    newCurrentAmount: newCurrentAmount
                  });

                  const { error: goalError } = await supabase
                    .from('goals')
                    .update({ current_amount: newCurrentAmount })
                    .eq('id', goal.id)
                    .eq('user_id', userId);

                  if (goalError) {
                    console.error('Error updating goal after deletion:', goalError);
                    // Don't show error to user as transaction was deleted successfully
                  } else {
                    console.log(`Goal "${goalName}" updated after deletion: ${goal.current_amount} - ${goalAmount} = ${newCurrentAmount}`);
                  }
                } else {
                  console.log(`Goal not found for name: "${goalName}"`);
                }
              } else {
                console.log('Not a goal transaction, skipping goal update');
              }

              console.log('Transaction deleted successfully from database');
              // Remove from local state
              setTransactions(prev => prev.filter(t => t.id !== id));
              
              Alert.alert('Success', 'Transaction deleted successfully!');
              
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
          }
        }
      ]
    );
  };

    const fetchTransactions = React.useCallback(async () => {
      setLoading(true);
      setError('');
      try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(name)')
        .eq('user_id', userId)
        .order('date', { ascending: false });
        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to fetch transactions.');
      } finally {
        setLoading(false);
      }
    }, [userId]);

  // Refresh transactions every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        fetchTransactions();
      }
    }, [userId, fetchTransactions])
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4f8cff" /><Text style={styles.loadingText}>Loading...</Text></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
    }
  if (!transactions.length) {
    return <View style={styles.center}><Text style={styles.emptyText}>No transactions found.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#636e72" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.historyTitle}>Transaction History</Text>
          <Text style={styles.historySubtitle}>Track all your financial activities</Text>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#e8f8f2' }]}> 
          <View style={styles.summaryLabelRow}><Ionicons name="arrow-up" size={14} color="#2ecc71" style={{ marginRight: 4 }} /><Text style={styles.summaryLabelSmall}>Income</Text></View>
          <Text style={[styles.summaryValueTiny, { color: '#2ecc71' }]}>{getCurrencySymbol(currency)}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#fbeaea' }]}> 
          <View style={styles.summaryLabelRow}><Ionicons name="arrow-down" size={14} color="#e74c3c" style={{ marginRight: 4 }} /><Text style={styles.summaryLabelSmall}>Expenses</Text></View>
          <Text style={[styles.summaryValueTiny, { color: '#e74c3c' }]}>{getCurrencySymbol(currency)}{Math.abs(totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#eaf6fb' }]}> 
          <View style={styles.summaryLabelRow}><Ionicons name="eye" size={14} color="#2980b9" style={{ marginRight: 4 }} /><Text style={styles.summaryLabelSmall}>Net</Text></View>
          <Text style={[styles.summaryValueTiny, { color: '#27ae60' }]}>{getCurrencySymbol(currency)}{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
      </View>
      {/* Search Bar */}
      <View style={styles.searchBarRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor="#b2bec3"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {/* Filter Bar */}
      <View style={styles.filterRow}>
        <View style={styles.tabsRow}>
          <Text
            style={[styles.tabBtn, tab === 'all' && styles.tabBtnActive]}
            onPress={() => setTab('all')}
          >All</Text>
          <Text
            style={[styles.tabBtn, tab === 'expenses' && styles.tabBtnActive]}
            onPress={() => setTab('expenses')}
          >Expenses</Text>
          <Text
            style={[styles.tabBtn, tab === 'income' && styles.tabBtnActive]}
            onPress={() => setTab('income')}
          >Income</Text>
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortAsc(s => !s)}>
          <Ionicons name={sortAsc ? 'arrow-up' : 'arrow-down'} size={18} color="#636e72" />
        </TouchableOpacity>
      </View>
      {/* Recent Transactions Bar */}
      <View style={styles.recentBarRow}>
        <Text style={styles.recentTitle}>Recent Transactions</Text>
        <View style={styles.recentCountBadge}>
          <Text style={styles.recentCountText}>{filteredTransactions.length} transactions</Text>
        </View>
      </View>
      {/* Grouped Transaction List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {groupedDates.map(date => (
          <View key={date} style={styles.groupSection}>
            <View style={styles.groupHeaderRow}>
              <Text style={styles.groupDate}>{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
              <Text style={styles.groupCount}>{groupedByDate[date].length} transaction{groupedByDate[date].length > 1 ? 's' : ''}</Text>
            </View>
            {groupedByDate[date].map(item => (
              <View key={item.id} style={styles.itemRowDetailed}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemCategory}>
                    {item.amount > 0 ? 'Income' : (typeof item.category === 'object' && item.category !== null ? item.category.name : (typeof item.category === 'string' ? item.category : 'Category'))}
                  </Text>
                  <Text style={styles.itemDescription}>{item.description || 'No Description'}</Text>
                  {item.notes ? <Text style={styles.itemNote}>{item.notes}</Text> : null}
                  <Text style={styles.itemDate}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.amountDetailed, { color: item.amount < 0 ? '#e74c3c' : '#2ecc71' }]}> 
                    {item.amount < 0 ? '-' : '+'}{getCurrencySymbol(currency)}{Math.abs(item.amount).toFixed(2)}
              </Text>
                  <TouchableOpacity onPress={() => handleEdit(item.id)} style={styles.menuDotsBtn}>
                    <MaterialCommunityIcons name="pencil-outline" size={22} color="#636e72" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.menuDotsBtn}>
                    <MaterialCommunityIcons name="delete-outline" size={22} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 14,
    color: '#636e72',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, marginHorizontal: 4, alignItems: 'flex-start', elevation: 2 },
  summaryLabel: { fontSize: 13, color: '#636e72', marginBottom: 2, fontWeight: 'bold' },
  summaryLabelSmall: { fontSize: 12, color: '#636e72', fontWeight: 'bold', marginBottom: 2 },
  summaryLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  summaryValue: { fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  summaryValueSmall: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  summaryValueTiny: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  searchBarRow: {
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#222',
    marginLeft: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 10,
    color: '#636e72',
    fontWeight: 'bold',
    fontSize: 15,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    color: '#222',
    elevation: 2,
  },
  sortBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 7,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#f5f6fa',
  },
  recentBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 2,
    paddingHorizontal: 20,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  recentCountBadge: {
    backgroundColor: '#f5f6fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  recentCountText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
  groupSection: {
    marginBottom: 10,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  groupDate: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  groupCount: {
    fontSize: 13,
    color: '#636e72',
    fontWeight: '500',
  },
  itemRowDetailed: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 24,
    paddingHorizontal: 16,
    minHeight: 90,
    marginBottom: 14,
    elevation: 1,
    marginTop: 8,
  },
  itemCategory: {
    fontSize: 13,
    color: '#6c63ff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 15,
    color: '#222',
    marginBottom: 1,
    fontWeight: '500',
  },
  itemNote: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 1,
    fontStyle: 'italic',
  },
  itemDate: {
    fontSize: 12,
    color: '#b2bec3',
    marginBottom: 0,
  },
  amountDetailed: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    marginTop: 2,
  },
  menuDotsBtn: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f6fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#636e72',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    color: '#636e72',
    fontWeight: '500',
  },
}); 