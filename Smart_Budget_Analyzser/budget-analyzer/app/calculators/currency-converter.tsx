import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  convert,
  getRates,
  getCacheAge,
  SUPPORTED_CURRENCIES,
} from '../services/exchangeRateService';

const HISTORY_KEY = 'conversion_history';
const QUICK_AMOUNTS_PKR = [100, 500, 1000, 5000, 10000, 50000];
const QUICK_AMOUNTS_USD = [1, 5, 10, 50, 100, 500];

interface HistoryItem {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: number;
}

export default function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState('PKR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheAge, setCacheAge] = useState('');
  const [fetchedAt, setFetchedAt] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState<'from' | 'to' | null>(null);
  const [rateDirection, setRateDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [prevRate, setPrevRate] = useState<number | null>(null);

  const swapAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fromInfo = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency)!;
  const toInfo = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency)!;
  const quickAmounts = fromCurrency === 'PKR' ? QUICK_AMOUNTS_PKR : QUICK_AMOUNTS_USD;

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const saveHistory = useCallback(async (item: HistoryItem) => {
    try {
      const updated = [item, ...history].slice(0, 20);
      setHistory(updated);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [history]);

  const fetchRate = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    try {
      const { rates, isFromCache: cached } = await getRates('USD', force);
      const timestamp = await AsyncStorage.getItem('exchange_rates_timestamp');
      const fetchTime = timestamp ? parseInt(timestamp, 10) : Date.now();

      let newRate: number;
      if (fromCurrency === 'USD') {
        newRate = rates.rates[toCurrency];
      } else if (toCurrency === 'USD') {
        newRate = 1 / rates.rates[fromCurrency];
      } else {
        newRate = (1 / rates.rates[fromCurrency]) * rates.rates[toCurrency];
      }

      if (prevRate !== null && newRate !== prevRate) {
        setRateDirection(newRate > prevRate ? 'up' : 'down');
      }
      setPrevRate(newRate);
      setRate(newRate);
      setLastUpdated(rates.lastUpdated);
      setIsFromCache(cached);
      setFetchedAt(fetchTime);
      setCacheAge(getCacheAge(fetchTime));

      // Recalculate existing amounts
      if (fromAmount) {
        const val = parseFloat(fromAmount);
        if (!isNaN(val)) setToAmount((val * newRate).toFixed(4));
      }
    } catch (err) {
      Alert.alert('Error', 'Could not fetch exchange rates. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fromCurrency, toCurrency, fromAmount, prevRate]);

  useEffect(() => {
    fetchRate();
    loadHistory();
  }, [fromCurrency, toCurrency]);

  // Update cache age label every minute
  useEffect(() => {
    if (!fetchedAt) return;
    const interval = setInterval(() => setCacheAge(getCacheAge(fetchedAt)), 60000);
    return () => clearInterval(interval);
  }, [fetchedAt]);

  const handleFromChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setFromAmount(cleaned);
    if (rate && cleaned !== '') {
      const val = parseFloat(cleaned);
      if (!isNaN(val)) {
        setToAmount((val * rate).toFixed(4));
      } else {
        setToAmount('');
      }
    } else {
      setToAmount('');
    }
  };

  const handleToChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setToAmount(cleaned);
    if (rate && cleaned !== '') {
      const val = parseFloat(cleaned);
      if (!isNaN(val)) {
        setFromAmount((val / rate).toFixed(4));
      } else {
        setFromAmount('');
      }
    } else {
      setFromAmount('');
    }
  };

  const handleSwap = () => {
    Animated.sequence([
      Animated.timing(swapAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(swapAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleQuickAmount = (amount: number) => {
    setFromAmount(amount.toString());
    if (rate) setToAmount((amount * rate).toFixed(4));

    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleSaveConversion = () => {
    if (!fromAmount || !toAmount || !rate) return;
    const item: HistoryItem = {
      from: fromCurrency,
      to: toCurrency,
      amount: parseFloat(fromAmount),
      result: parseFloat(toAmount),
      rate,
      timestamp: Date.now(),
    };
    saveHistory(item);
    // Visual feedback
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const formatNumber = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return num.toFixed(4).replace(/\.?0+$/, '');
  };

  const swapRotate = swapAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const rateColor = rateDirection === 'up' ? '#00b894' : rateDirection === 'down' ? '#d63031' : '#4f8cff';
  const rateIcon = rateDirection === 'up' ? 'trending-up' : rateDirection === 'down' ? 'trending-down' : 'remove';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Rate Banner */}
        <LinearGradient colors={['#4f8cff', '#6a82fb']} style={styles.rateBanner}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.rateBannerContent}>
              <View style={styles.rateRow}>
                <Ionicons name={rateIcon as any} size={18} color={rateColor === '#4f8cff' ? '#fff' : rateColor} />
                <Text style={styles.rateText}>
                  {' '}1 {fromInfo.flag} {fromCurrency} = {rate ? rate.toFixed(4) : '—'} {toInfo.flag} {toCurrency}
                </Text>
              </View>
              <View style={styles.rateMetaRow}>
                <Text style={styles.rateMeta}>
                  {isFromCache ? `📦 Cached • ${cacheAge}` : '🟢 Live rate'}
                </Text>
                <TouchableOpacity onPress={() => fetchRate(true)} disabled={refreshing} style={styles.refreshBtn}>
                  {refreshing
                    ? <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                    : <Ionicons name="refresh" size={16} color="rgba(255,255,255,0.9)" />
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Converter Card */}
        <Animated.View style={[styles.converterCard, { transform: [{ scale: pulseAnim }] }]}>

          {/* FROM field */}
          <View style={styles.fieldBlock}>
            <TouchableOpacity style={styles.currencySelector} onPress={() => setShowCurrencyPicker('from')}>
              <Text style={styles.currencyFlag}>{fromInfo.flag}</Text>
              <View>
                <Text style={styles.currencyCode}>{fromInfo.code}</Text>
                <Text style={styles.currencyName}>{fromInfo.name}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#636e72" style={styles.chevron} />
            </TouchableOpacity>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>{fromInfo.symbol}</Text>
              <TextInput
                style={styles.amountInput}
                value={fromAmount}
                onChangeText={handleFromChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#b2bec3"
              />
            </View>
            {fromAmount ? (
              <Text style={styles.spelledOut}>{formatNumber(fromAmount)} {fromCurrency}</Text>
            ) : null}
          </View>

          {/* Swap Button */}
          <View style={styles.swapRow}>
            <View style={styles.dividerLine} />
            <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
              <Animated.View style={{ transform: [{ rotate: swapRotate }] }}>
                <MaterialCommunityIcons name="swap-vertical-bold" size={26} color="#fff" />
              </Animated.View>
            </TouchableOpacity>
            <View style={styles.dividerLine} />
          </View>

          {/* TO field */}
          <View style={styles.fieldBlock}>
            <TouchableOpacity style={styles.currencySelector} onPress={() => setShowCurrencyPicker('to')}>
              <Text style={styles.currencyFlag}>{toInfo.flag}</Text>
              <View>
                <Text style={styles.currencyCode}>{toInfo.code}</Text>
                <Text style={styles.currencyName}>{toInfo.name}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#636e72" style={styles.chevron} />
            </TouchableOpacity>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>{toInfo.symbol}</Text>
              <TextInput
                style={styles.amountInput}
                value={toAmount}
                onChangeText={handleToChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#b2bec3"
              />
            </View>
            {toAmount ? (
              <Text style={styles.spelledOut}>{formatNumber(toAmount)} {toCurrency}</Text>
            ) : null}
          </View>

          {/* Save Button */}
          {fromAmount && toAmount ? (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveConversion}>
              <Ionicons name="bookmark-outline" size={16} color="#4f8cff" />
              <Text style={styles.saveBtnText}>Save to History</Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        {/* Quick Amounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Amounts ({fromCurrency})</Text>
          <View style={styles.quickGrid}>
            {quickAmounts.map(amt => (
              <TouchableOpacity key={amt} style={styles.quickChip} onPress={() => handleQuickAmount(amt)}>
                <Text style={styles.quickChipText}>
                  {fromInfo.symbol}{amt >= 1000 ? `${amt / 1000}K` : amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Inverse Rate Card */}
        {rate && (
          <View style={styles.inverseCard}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#636e72" />
            <Text style={styles.inverseText}>
              {'  '}1 {toInfo.flag} {toCurrency} = {(1 / rate).toFixed(4)} {fromInfo.flag} {fromCurrency}
            </Text>
          </View>
        )}

        {/* Conversion History */}
        {history.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowHistory(!showHistory)}>
              <Text style={styles.sectionTitle}>Recent Conversions</Text>
              <Ionicons name={showHistory ? 'chevron-up' : 'chevron-down'} size={18} color="#636e72" />
            </TouchableOpacity>
            {showHistory && (
              <View style={styles.historyList}>
                {history.slice(0, 5).map((item, i) => {
                  const fInfo = SUPPORTED_CURRENCIES.find(c => c.code === item.from)!;
                  const tInfo = SUPPORTED_CURRENCIES.find(c => c.code === item.to)!;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.historyItem}
                      onPress={() => {
                        setFromCurrency(item.from);
                        setToCurrency(item.to);
                        setFromAmount(item.amount.toString());
                        setToAmount(item.result.toString());
                        setShowHistory(false);
                      }}
                    >
                      <View style={styles.historyLeft}>
                        <Text style={styles.historyAmount}>{fInfo.symbol}{item.amount.toLocaleString()}</Text>
                        <Text style={styles.historyPair}>{item.from} → {item.to}</Text>
                      </View>
                      <View style={styles.historyRight}>
                        <Text style={styles.historyResult}>{tInfo.symbol}{item.result.toFixed(2)}</Text>
                        <Text style={styles.historyTime}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Currency Picker Modal */}
      <Modal visible={showCurrencyPicker !== null} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(null)}>
                <Ionicons name="close" size={24} color="#2d3436" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SUPPORTED_CURRENCIES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => {
                const isSelected = showCurrencyPicker === 'from'
                  ? item.code === fromCurrency
                  : item.code === toCurrency;
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => {
                      if (showCurrencyPicker === 'from') setFromCurrency(item.code);
                      else setToCurrency(item.code);
                      setShowCurrencyPicker(null);
                    }}
                  >
                    <Text style={styles.pickerFlag}>{item.flag}</Text>
                    <View style={styles.pickerItemText}>
                      <Text style={[styles.pickerCode, isSelected && styles.pickerCodeSelected]}>{item.code}</Text>
                      <Text style={styles.pickerName}>{item.name}</Text>
                    </View>
                    <Text style={styles.pickerSymbol}>{item.symbol}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#4f8cff" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16 },
  rateBanner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rateBannerContent: { gap: 6 },
  rateRow: { flexDirection: 'row', alignItems: 'center' },
  rateText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  rateMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rateMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  refreshBtn: { padding: 4 },
  converterCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    marginBottom: 16,
  },
  fieldBlock: { marginBottom: 4 },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  currencyFlag: { fontSize: 28, marginRight: 10 },
  currencyCode: { fontSize: 16, fontWeight: '700', color: '#2d3436' },
  currencyName: { fontSize: 12, color: '#636e72' },
  chevron: { marginLeft: 'auto' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#dfe6f5',
  },
  currencySymbol: { fontSize: 20, fontWeight: '600', color: '#4f8cff', marginRight: 8 },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3436',
    paddingVertical: 12,
  },
  spelledOut: { fontSize: 12, color: '#636e72', marginTop: 4, marginLeft: 4 },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#dfe6e9' },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f8cff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    elevation: 4,
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4f8cff',
    backgroundColor: '#f0f4ff',
  },
  saveBtnText: { color: '#4f8cff', fontWeight: '600', marginLeft: 6, fontSize: 14 },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2d3436', marginBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#dfe6f5',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickChipText: { color: '#4f8cff', fontWeight: '700', fontSize: 13 },
  inverseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f4ff',
  },
  inverseText: { color: '#636e72', fontSize: 13 },
  historyList: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f4ff',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  historyLeft: {},
  historyAmount: { fontSize: 15, fontWeight: '700', color: '#2d3436' },
  historyPair: { fontSize: 12, color: '#636e72', marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyResult: { fontSize: 15, fontWeight: '700', color: '#4f8cff' },
  historyTime: { fontSize: 11, color: '#b2bec3', marginTop: 2 },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    maxHeight: '75%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: '#2d3436' },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  pickerItemSelected: { backgroundColor: '#f0f4ff' },
  pickerFlag: { fontSize: 26, marginRight: 14 },
  pickerItemText: { flex: 1 },
  pickerCode: { fontSize: 15, fontWeight: '700', color: '#2d3436' },
  pickerCodeSelected: { color: '#4f8cff' },
  pickerName: { fontSize: 12, color: '#636e72', marginTop: 2 },
  pickerSymbol: { fontSize: 14, color: '#636e72', marginRight: 10 },
});
