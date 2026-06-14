import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'df3f87e910e9ef2a4d97a5e3';
const BASE_URL = 'https://v6.exchangerate-api.com/v6';
const CACHE_KEY = 'exchange_rates_cache';
const CACHE_TIMESTAMP_KEY = 'exchange_rates_timestamp';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface ExchangeRates {
  base: string;
  rates: { [currency: string]: number };
  lastUpdated: string;
  nextUpdate: string;
}

export interface CachedRates {
  data: ExchangeRates;
  fetchedAt: number;
}

export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  lastUpdated: string;
  isFromCache: boolean;
}

const SUPPORTED_CURRENCIES = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
];

export { SUPPORTED_CURRENCIES };

async function fetchRatesFromAPI(base: string = 'USD'): Promise<ExchangeRates> {
  const response = await fetch(`${BASE_URL}/${API_KEY}/latest/${base}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const json = await response.json();
  if (json.result !== 'success') {
    throw new Error(json['error-type'] || 'Unknown API error');
  }
  return {
    base: json.base_code,
    rates: json.conversion_rates,
    lastUpdated: json.time_last_update_utc,
    nextUpdate: json.time_next_update_utc,
  };
}

async function getCachedRates(): Promise<CachedRates | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (cached && timestamp) {
      return { data: JSON.parse(cached), fetchedAt: parseInt(timestamp, 10) };
    }
  } catch {
    // ignore cache errors
  }
  return null;
}

async function saveToCache(data: ExchangeRates): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // ignore cache errors
  }
}

export async function getRates(base: string = 'USD', forceRefresh = false): Promise<{ rates: ExchangeRates; isFromCache: boolean }> {
  const cached = await getCachedRates();
  const now = Date.now();

  if (!forceRefresh && cached && now - cached.fetchedAt < CACHE_DURATION_MS && cached.data.base === base) {
    return { rates: cached.data, isFromCache: true };
  }

  try {
    const fresh = await fetchRatesFromAPI(base);
    await saveToCache(fresh);
    return { rates: fresh, isFromCache: false };
  } catch (err) {
    if (cached) {
      return { rates: cached.data, isFromCache: true };
    }
    throw err;
  }
}

export async function convert(
  amount: number,
  from: string,
  to: string,
  forceRefresh = false
): Promise<ConversionResult> {
  const { rates, isFromCache } = await getRates('USD', forceRefresh);

  // Convert via USD as base
  let rate: number;
  if (from === 'USD') {
    rate = rates.rates[to];
  } else if (to === 'USD') {
    rate = 1 / rates.rates[from];
  } else {
    const fromToUSD = 1 / rates.rates[from];
    const usdToTarget = rates.rates[to];
    rate = fromToUSD * usdToTarget;
  }

  return {
    from,
    to,
    amount,
    result: amount * rate,
    rate,
    lastUpdated: rates.lastUpdated,
    isFromCache,
  };
}

export function getCacheAge(fetchedAt: number): string {
  const diff = Date.now() - fetchedAt;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
