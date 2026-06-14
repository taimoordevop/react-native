import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Pakistan FBR Tax Slabs — Finance Act 2025 (FY 2025-26) ─────────────────
// Effective: July 1, 2025 – June 30, 2026
// Source: FBR Finance Act 2025 | PwC Tax Summaries | FBR.gov.pk

// Salaried Individuals FY 2025-26
const TAX_SLABS_SALARIED_2526 = [
  { min: 0,       max: 600000,   fixed: 0,      rate: 0.00 },  // 0%
  { min: 600001,  max: 1200000,  fixed: 0,      rate: 0.01 },  // 1%   (was 5%)
  { min: 1200001, max: 2200000,  fixed: 6000,   rate: 0.11 },  // Rs.6K + 11%  (was Rs.30K + 15%)
  { min: 2200001, max: 3200000,  fixed: 116000, rate: 0.23 },  // Rs.116K + 23% (was Rs.180K + 25%)
  { min: 3200001, max: 4100000,  fixed: 346000, rate: 0.30 },  // Rs.346K + 30% (was Rs.430K)
  { min: 4100001, max: Infinity, fixed: 616000, rate: 0.35 },  // Rs.616K + 35% (was Rs.700K)
];
// Surcharge: 9% of income tax if taxable income > Rs.10 million

// Business / Non-Salaried / AOP FY 2025-26
const TAX_SLABS_BUSINESS_2526 = [
  { min: 0,        max: 600000,   fixed: 0,        rate: 0.00 },  // 0%
  { min: 600001,   max: 1200000,  fixed: 0,        rate: 0.15 },  // 15%   (was 7%)
  { min: 1200001,  max: 2400000,  fixed: 90000,    rate: 0.20 },  // Rs.90K + 20%
  { min: 2400001,  max: 3600000,  fixed: 330000,   rate: 0.30 },  // Rs.330K + 30%
  { min: 3600001,  max: 6000000,  fixed: 690000,   rate: 0.35 },  // Rs.690K + 35%
  { min: 6000001,  max: Infinity, fixed: 1530000,  rate: 0.40 },  // Rs.1.53M + 40% (AOP cap)
];
// Surcharge: 10% of income tax if taxable income > Rs.10 million

// ─── Historical: FY 2024-25 (for comparison only) ────────────────────────────
const TAX_SLABS_SALARIED_2425 = [
  { min: 0,       max: 600000,   fixed: 0,      rate: 0.00 },
  { min: 600001,  max: 1200000,  fixed: 0,      rate: 0.05 },
  { min: 1200001, max: 2200000,  fixed: 30000,  rate: 0.15 },
  { min: 2200001, max: 3200000,  fixed: 180000, rate: 0.25 },
  { min: 3200001, max: 4100000,  fixed: 430000, rate: 0.30 },
  { min: 4100001, max: Infinity, fixed: 700000, rate: 0.35 },
];
const TAX_SLABS_BUSINESS_2425 = [
  { min: 0,       max: 600000,   fixed: 0,       rate: 0.00 },
  { min: 600001,  max: 1200000,  fixed: 0,       rate: 0.07 },
  { min: 1200001, max: 1600000,  fixed: 42000,   rate: 0.10 },
  { min: 1600001, max: 3200000,  fixed: 82000,   rate: 0.15 },
  { min: 3200001, max: 5600000,  fixed: 322000,  rate: 0.20 },
  { min: 5600001, max: 8800000,  fixed: 802000,  rate: 0.25 },
  { min: 8800001, max: Infinity, fixed: 1602000, rate: 0.32 },
];

// Non-filer surcharge: 100% extra (doubled rates per FBR ATL 2025-26)
function computeTax(income: number, slabs: typeof TAX_SLABS_SALARIED_2425): number {
  for (const slab of slabs) {
    if (income >= slab.min && income <= slab.max) {
      const excess = income - (slab.min - 1);
      return slab.fixed + excess * slab.rate;
    }
  }
  return 0;
}

function SlabRow({ slab, income, index }: {
  slab: typeof TAX_SLABS_SALARIED_2425[0]; income: number; index: number;
}) {
  const isActive = income >= slab.min && income <= slab.max;
  const fmt = (n: number) => n === Infinity ? 'Above' : '₨' + n.toLocaleString();
  return (
    <View style={[ss.slabRow, index % 2 === 0 && ss.slabRowAlt, isActive && ss.slabRowActive]}>
      <View style={ss.slabRange}>
        <Text style={[ss.slabText, isActive && ss.slabTextActive]}>{fmt(slab.min)}</Text>
        <Text style={[ss.slabText, isActive && ss.slabTextActive, { color: '#636e72' }]}> – </Text>
        <Text style={[ss.slabText, isActive && ss.slabTextActive]}>{fmt(slab.max)}</Text>
      </View>
      <Text style={[ss.slabRate, isActive && { color: '#fd79a8', fontWeight: '800' }]}>
        {(slab.rate * 100).toFixed(0)}%
      </Text>
      {isActive && (
        <View style={ss.activeBadge}>
          <Text style={ss.activeBadgeText}>YOU</Text>
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  slabRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 12 },
  slabRowAlt: { backgroundColor: '#fafafa' },
  slabRowActive: { backgroundColor: '#fff5f8', borderLeftWidth: 3, borderLeftColor: '#fd79a8' },
  slabRange: { flex: 1, flexDirection: 'row' },
  slabText: { fontSize: 11, color: '#2d3436' },
  slabTextActive: { fontWeight: '700', color: '#2d3436' },
  slabRate: { fontSize: 13, fontWeight: '600', color: '#636e72', marginLeft: 8 },
  activeBadge: { backgroundColor: '#fd79a8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 6 },
  activeBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TaxCalculator() {
  const [annualIncome, setAnnualIncome] = useState('');
  const [incomeType, setIncomeType] = useState<'salaried' | 'business'>('salaried');
  const [filerStatus, setFilerStatus] = useState<'filer' | 'nonfiler'>('filer');
  const [zakatPaid, setZakatPaid] = useState('');
  const [donations, setDonations] = useState('');
  const [showSlabs, setShowSlabs] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const [taxResult, setTaxResult] = useState({
    grossIncome: 0, deductions: 0, taxableIncome: 0,
    baseTax: 0, surcharge: 0, totalTax: 0,
    effectiveRate: 0, monthlyTax: 0, netAnnual: 0, netMonthly: 0,
    filerTax: 0, nonFilerTax: 0, tax2425: 0, taxSaving: 0,
  });

  const slabs = incomeType === 'salaried' ? TAX_SLABS_SALARIED_2526 : TAX_SLABS_BUSINESS_2526;

  const calculate = useCallback(() => {
    const gross = parseFloat(annualIncome) || 0;
    const zakat = parseFloat(zakatPaid) || 0;
    const donation = parseFloat(donations) || 0;
    const totalDeductions = zakat + donation;
    const taxable = Math.max(0, gross - totalDeductions);

    const baseTax = computeTax(taxable, slabs);
    // High-income surcharge: 9% (salaried) or 10% (business) if income > 10M
    const highIncomeSurcharge = taxable > 10000000
      ? baseTax * (incomeType === 'salaried' ? 0.09 : 0.10)
      : 0;
    // Non-filer surcharge: higher withholding tax applies
    const nonFilerSurcharge = filerStatus === 'nonfiler' ? baseTax * 0.25 : 0;
    const surcharge = highIncomeSurcharge + nonFilerSurcharge;
    const totalTax = baseTax + surcharge;
    const effectiveRate = gross > 0 ? (totalTax / gross) * 100 : 0;

    // Filer vs non-filer comparison (using current FY 2025-26 slabs)
    const filerTax = computeTax(taxable, slabs) + highIncomeSurcharge;
    const nonFilerTax = filerTax + computeTax(taxable, slabs) * 0.25;

    // Year-over-year comparison: FY 2024-25 vs FY 2025-26
    const prevSlabs = incomeType === 'salaried' ? TAX_SLABS_SALARIED_2425 : TAX_SLABS_BUSINESS_2425;
    const tax2425 = computeTax(taxable, prevSlabs);
    const taxSaving = tax2425 - baseTax;

    setTaxResult({
      grossIncome: gross, deductions: totalDeductions, taxableIncome: taxable,
      baseTax, surcharge, totalTax, effectiveRate,
      monthlyTax: totalTax / 12,
      netAnnual: gross - totalTax,
      netMonthly: (gross - totalTax) / 12,
      filerTax, nonFilerTax, tax2425, taxSaving,
    });
    setCalculated(true);
  }, [annualIncome, incomeType, filerStatus, zakatPaid, donations, slabs]);

  const fmt = (n: number) => '₨ ' + Math.round(n).toLocaleString('en-PK');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient colors={['#fd79a8', '#e84393']} style={s.hero}>
        <MaterialCommunityIcons name="file-document" size={32} color="rgba(255,255,255,0.95)" />
        <Text style={s.heroTitle}>Pakistan Tax Calculator</Text>
        <Text style={s.heroSub}>FBR Income Tax — FY 2025-26 (Finance Act 2025)</Text>
      </LinearGradient>

      {/* Income Type Toggle */}
      <View style={s.toggleWrap}>
        {(['salaried', 'business'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.toggleBtn, incomeType === t && s.toggleActive]}
            onPress={() => setIncomeType(t)}
          >
            <Ionicons
              name={t === 'salaried' ? 'person-outline' : 'business-outline'}
              size={16}
              color={incomeType === t ? '#fff' : '#636e72'}
            />
            <Text style={[s.toggleText, incomeType === t && s.toggleTextActive]}>
              {t === 'salaried' ? 'Salaried Person' : 'Business / AOP'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inputs */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Income Details</Text>

        <View style={s.inputRow}>
          <View style={s.inputLabelRow}>
            <Ionicons name="cash-outline" size={15} color="#fd79a8" />
            <Text style={s.inputLabel}>Annual Gross Income (PKR)</Text>
          </View>
          <View style={s.inputBox}>
            <TextInput
              style={s.input}
              value={annualIncome}
              onChangeText={t => setAnnualIncome(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="1200000"
              placeholderTextColor="#b2bec3"
            />
          </View>
          {annualIncome && (
            <Text style={s.perMonth}>
              Monthly: {fmt(parseFloat(annualIncome) / 12)}
            </Text>
          )}
        </View>

        {/* Filer Status */}
        <View style={s.inputRow}>
          <View style={s.inputLabelRow}>
            <Ionicons name="shield-checkmark-outline" size={15} color="#fd79a8" />
            <Text style={s.inputLabel}>FBR Filer Status</Text>
          </View>
          <View style={s.filerRow}>
            {(['filer', 'nonfiler'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={[s.filerBtn, filerStatus === f && s.filerBtnActive]}
                onPress={() => setFilerStatus(f)}
              >
                <Ionicons
                  name={f === 'filer' ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={filerStatus === f ? '#fff' : (f === 'filer' ? '#00b894' : '#d63031')}
                />
                <Text style={[s.filerText, filerStatus === f && s.filerTextActive]}>
                  {f === 'filer' ? 'Active Filer' : 'Non-Filer'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Deductions */}
        <Text style={[s.cardTitle, { marginTop: 4 }]}>Deductions (Optional)</Text>
        {[
          { label: 'Zakat Paid', value: zakatPaid, set: setZakatPaid, icon: 'moon-outline' },
          { label: 'Charitable Donations', value: donations, set: setDonations, icon: 'heart-outline' },
        ].map(item => (
          <View key={item.label} style={s.inputRow}>
            <View style={s.inputLabelRow}>
              <Ionicons name={item.icon as any} size={15} color="#fd79a8" />
              <Text style={s.inputLabel}>{item.label} (PKR)</Text>
            </View>
            <View style={s.inputBox}>
              <TextInput
                style={s.input}
                value={item.value}
                onChangeText={t => item.set(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#b2bec3"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={s.calcBtn} onPress={calculate}>
          <LinearGradient colors={['#fd79a8', '#e84393']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.calcBtnGrad}>
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={s.calcBtnText}>Calculate Tax</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {calculated && (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>Tax Summary</Text>

            {/* Main Highlight */}
            <View style={s.taxHighlight}>
              <Text style={s.taxHighlightLabel}>Total Annual Tax</Text>
              <Text style={s.taxHighlightValue}>{fmt(taxResult.totalTax)}</Text>
              <View style={s.rateRow}>
                <View style={[s.rateBadge, { backgroundColor: taxResult.effectiveRate < 5 ? '#e8f5e9' : taxResult.effectiveRate < 15 ? '#fff8e1' : '#fce4ec' }]}>
                  <Text style={[s.rateBadgeText, { color: taxResult.effectiveRate < 5 ? '#2e7d32' : taxResult.effectiveRate < 15 ? '#f57f17' : '#c62828' }]}>
                    {taxResult.effectiveRate.toFixed(2)}% effective rate
                  </Text>
                </View>
              </View>
            </View>

            {/* Breakdown */}
            {[
              { label: 'Gross Income', value: fmt(taxResult.grossIncome), color: '#4f8cff', icon: 'cash-outline' },
              { label: 'Total Deductions', value: fmt(taxResult.deductions), color: '#00b894', icon: 'remove-circle-outline' },
              { label: 'Taxable Income', value: fmt(taxResult.taxableIncome), color: '#fdcb6e', icon: 'document-text-outline' },
              { label: 'Base Tax', value: fmt(taxResult.baseTax), color: '#fd79a8', icon: 'calculator-outline' },
              ...(taxResult.surcharge > 0 ? [{ label: filerStatus === 'nonfiler' ? 'Non-Filer Surcharge (25%)' : 'High-Income Surcharge (9%)', value: fmt(taxResult.surcharge), color: '#d63031', icon: 'warning-outline' as string }] : []),
              { label: 'Total Tax Payable', value: fmt(taxResult.totalTax), color: '#e84393', icon: 'receipt-outline' },
            ].map((item, i) => (
              <View key={i} style={[s.breakRow, i % 2 === 0 && { backgroundColor: '#fafafa' }]}>
                <Ionicons name={item.icon as any} size={15} color={item.color} style={{ marginRight: 8 }} />
                <Text style={s.breakLabel}>{item.label}</Text>
                <Text style={[s.breakValue, { color: item.color }]}>{item.value}</Text>
              </View>
            ))}

            {/* Monthly / Net */}
            <View style={s.netGrid}>
              {[
                { label: 'Monthly Tax', value: fmt(taxResult.monthlyTax), color: '#fd79a8' },
                { label: 'Net Annual', value: fmt(taxResult.netAnnual), color: '#00b894' },
                { label: 'Net Monthly', value: fmt(taxResult.netMonthly), color: '#4f8cff' },
              ].map(item => (
                <View key={item.label} style={s.netCard}>
                  <Text style={[s.netValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={s.netLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Year-over-Year Tax Relief Card */}
          {taxResult.taxSaving !== 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Tax Relief: FY 2024-25 vs FY 2025-26</Text>
              <View style={s.yoyRow}>
                <View style={s.yoyCard}>
                  <Text style={s.yoyYear}>FY 2024-25</Text>
                  <Text style={[s.yoyTax, { color: '#d63031' }]}>{fmt(taxResult.tax2425)}</Text>
                  <Text style={s.yoySub}>Old Tax</Text>
                </View>
                <View style={s.yoyArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#00b894" />
                  <View style={[s.yoySavingBadge, { backgroundColor: taxResult.taxSaving > 0 ? '#e8f5e9' : '#fce4ec' }]}>
                    <Text style={[s.yoySavingText, { color: taxResult.taxSaving > 0 ? '#2e7d32' : '#c62828' }]}>
                      {taxResult.taxSaving > 0 ? '-' : '+'}{fmt(Math.abs(taxResult.taxSaving))}
                    </Text>
                    <Text style={s.yoySavingSub}>{taxResult.taxSaving > 0 ? 'saved!' : 'more'}</Text>
                  </View>
                </View>
                <View style={s.yoyCard}>
                  <Text style={s.yoyYear}>FY 2025-26</Text>
                  <Text style={[s.yoyTax, { color: '#00b894' }]}>{fmt(taxResult.baseTax)}</Text>
                  <Text style={s.yoySub}>New Tax</Text>
                </View>
              </View>
              {taxResult.taxSaving > 0 && (
                <View style={s.yoyNote}>
                  <Ionicons name="information-circle-outline" size={14} color="#636e72" />
                  <Text style={s.yoyNoteText}>
                    {'  '}Finance Act 2025 provides significant relief for {incomeType === 'salaried' ? 'salaried individuals' : 'business / AOP'}.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Filer vs Non-Filer */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Filer vs Non-Filer</Text>
            <View style={s.compareRow}>
              <View style={[s.compareCard, { borderColor: '#00b894' }]}>
                <Ionicons name="checkmark-circle" size={22} color="#00b894" />
                <Text style={s.compareTitle}>Active Filer</Text>
                <Text style={[s.compareAmount, { color: '#00b894' }]}>{fmt(taxResult.filerTax)}</Text>
                <Text style={s.compareSub}>Annual Tax</Text>
              </View>
              <View style={s.compareDivider}>
                <Text style={s.compareSaving}>
                  Save {fmt(taxResult.nonFilerTax - taxResult.filerTax)}
                </Text>
                <Text style={s.compareSavingSub}>by filing!</Text>
              </View>
              <View style={[s.compareCard, { borderColor: '#d63031' }]}>
                <Ionicons name="close-circle" size={22} color="#d63031" />
                <Text style={s.compareTitle}>Non-Filer</Text>
                <Text style={[s.compareAmount, { color: '#d63031' }]}>{fmt(taxResult.nonFilerTax)}</Text>
                <Text style={s.compareSub}>Annual Tax</Text>
              </View>
            </View>
          </View>

          {/* Tax Slabs Table */}
          <View style={s.card}>
            <TouchableOpacity style={s.slabsToggle} onPress={() => setShowSlabs(!showSlabs)}>
              <Text style={s.cardTitle}>FY 2025-26 Tax Slabs</Text>
              <Text style={s.slabsToggleText}>{incomeType === 'salaried' ? 'Salaried' : 'Business/AOP'}</Text>
              <Ionicons name={showSlabs ? 'chevron-up' : 'chevron-down'} size={18} color="#636e72" />
            </TouchableOpacity>
            {showSlabs && (
              <View style={s.slabsTable}>
                <View style={[ss.slabRow, { backgroundColor: '#fff5f8' }]}>
                  <Text style={[ss.slabText, { flex: 1, fontWeight: '700', color: '#2d3436' }]}>Income Range</Text>
                  <Text style={[ss.slabRate, { fontWeight: '700', color: '#2d3436' }]}>Rate</Text>
                </View>
                {slabs.map((slab, i) => (
                  <SlabRow key={i} slab={slab} income={parseFloat(annualIncome) || 0} index={i} />
                ))}
              </View>
            )}
          </View>
        </>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 16 },
  hero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 4, shadowColor: '#e84393', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  toggleWrap: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  toggleActive: { backgroundColor: '#e84393' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#636e72' },
  toggleTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2d3436', marginBottom: 16 },
  inputRow: { marginBottom: 14 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#636e72' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#dfe6f5' },
  input: { flex: 1, fontSize: 18, fontWeight: '600', color: '#2d3436', paddingVertical: 12 },
  perMonth: { fontSize: 12, color: '#636e72', marginTop: 4, marginLeft: 4 },
  filerRow: { flexDirection: 'row', gap: 10 },
  filerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f8f9fa', borderWidth: 1.5, borderColor: '#dfe6f5' },
  filerBtnActive: { backgroundColor: '#e84393', borderColor: '#e84393' },
  filerText: { fontSize: 13, fontWeight: '600', color: '#636e72' },
  filerTextActive: { color: '#fff' },
  calcBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  calcBtnGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  taxHighlight: { backgroundColor: '#fff0f6', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: '#fd79a8' },
  taxHighlightLabel: { fontSize: 13, color: '#636e72', fontWeight: '600' },
  taxHighlightValue: { fontSize: 32, fontWeight: '800', color: '#e84393', marginVertical: 4 },
  rateRow: { alignItems: 'center' },
  rateBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  rateBadgeText: { fontSize: 13, fontWeight: '700' },
  breakRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f8f9fa' },
  breakLabel: { flex: 1, fontSize: 13, color: '#636e72' },
  breakValue: { fontSize: 14, fontWeight: '700' },
  netGrid: { flexDirection: 'row', gap: 8, marginTop: 14 },
  netCard: { flex: 1, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, alignItems: 'center' },
  netValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  netLabel: { fontSize: 10, color: '#636e72', marginTop: 3, textAlign: 'center' },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compareCard: { flex: 1, borderRadius: 14, borderWidth: 2, padding: 14, alignItems: 'center', gap: 4 },
  compareTitle: { fontSize: 13, fontWeight: '700', color: '#2d3436' },
  compareAmount: { fontSize: 15, fontWeight: '800' },
  compareSub: { fontSize: 11, color: '#636e72' },
  compareDivider: { alignItems: 'center' },
  compareSaving: { fontSize: 12, fontWeight: '700', color: '#00b894', textAlign: 'center' },
  compareSavingSub: { fontSize: 11, color: '#636e72' },
  slabsToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slabsToggleText: { backgroundColor: '#fff5f8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 11, color: '#e84393', fontWeight: '600' },
  slabsTable: { marginTop: 12, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' },
  yoyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yoyCard: { flex: 1, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, alignItems: 'center' },
  yoyYear: { fontSize: 11, color: '#636e72', fontWeight: '600', marginBottom: 4 },
  yoyTax: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  yoySub: { fontSize: 10, color: '#636e72', marginTop: 2 },
  yoyArrow: { alignItems: 'center', gap: 6 },
  yoySavingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignItems: 'center' },
  yoySavingText: { fontSize: 12, fontWeight: '700' },
  yoySavingSub: { fontSize: 10, color: '#636e72' },
  yoyNote: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, backgroundColor: '#f0f4ff', borderRadius: 10, padding: 10 },
  yoyNoteText: { fontSize: 12, color: '#636e72', flex: 1, lineHeight: 18 },
});
