import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

// ─── Bar Chart (yearly growth) ────────────────────────────────────────────────
function GrowthChart({ data }: { data: { year: number; value: number }[] }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.value));
  const chartH = 120;
  const chartW = 280;
  const barW = Math.min(28, (chartW / data.length) - 6);
  const spacing = chartW / data.length;

  return (
    <View style={chartStyles.wrap}>
      <Svg width={chartW + 20} height={chartH + 40}>
        {data.map((d, i) => {
          const barH = maxVal > 0 ? (d.value / maxVal) * chartH : 0;
          const x = i * spacing + spacing / 2 - barW / 2 + 10;
          const y = chartH - barH;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={barW} height={barH} rx={4} fill="#a29bfe" />
              <Rect x={x} y={y} width={barW} height={Math.min(barH, 12)} rx={4} fill="#6c5ce7" />
              {(i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) && (
                <SvgText x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize="10" fill="#636e72">
                  Y{d.year}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
        <Line x1={10} y1={chartH} x2={chartW + 10} y2={chartH} stroke="#f0f0f0" strokeWidth={1} />
      </Svg>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 8 },
});

// ─── Input Row ────────────────────────────────────────────────────────────────
function InputRow({ label, value, onChange, placeholder, suffix, icon, color = '#6c5ce7' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; suffix?: string; icon: string; color?: string;
}) {
  return (
    <View style={s.inputRow}>
      <View style={s.inputLabelRow}>
        <Ionicons name={icon as any} size={15} color={color} />
        <Text style={s.inputLabel}>{label}</Text>
      </View>
      <View style={s.inputBox}>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={t => onChange(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor="#b2bec3"
        />
        {suffix && <Text style={s.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <View style={[s.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={20} color={color} style={{ marginBottom: 6 }} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InvestmentCalculator() {
  const [mode, setMode] = useState<'lump' | 'sip'>('lump');
  const [principal, setPrincipal] = useState('');
  const [monthlyInvest, setMonthlyInvest] = useState('');
  const [returnRate, setReturnRate] = useState('');
  const [years, setYears] = useState('');
  const [compounding, setCompounding] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [calculated, setCalculated] = useState(false);

  const [finalAmount, setFinalAmount] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);
  const [returnPct, setReturnPct] = useState(0);
  const [yearlyData, setYearlyData] = useState<{ year: number; value: number }[]>([]);

  const compFreq = compounding === 'monthly' ? 12 : compounding === 'quarterly' ? 4 : 1;
  const fmt = (n: number) => '₨ ' + Math.round(n).toLocaleString('en-PK');

  const calculate = useCallback(() => {
    const r = parseFloat(returnRate) / 100 || 0;
    const t = parseFloat(years) || 0;
    const n = compFreq;

    let fv = 0;
    let invested = 0;
    const data: { year: number; value: number }[] = [];

    if (mode === 'lump') {
      const P = parseFloat(principal) || 0;
      invested = P;
      for (let y = 1; y <= t; y++) {
        data.push({ year: y, value: P * Math.pow(1 + r / n, n * y) });
      }
      fv = P * Math.pow(1 + r / n, n * t);
    } else {
      const pmt = parseFloat(monthlyInvest) || 0;
      const rMonthly = r / 12;
      const months = t * 12;
      invested = pmt * months;
      for (let y = 1; y <= t; y++) {
        const mo = y * 12;
        const val = rMonthly > 0
          ? pmt * ((Math.pow(1 + rMonthly, mo) - 1) / rMonthly) * (1 + rMonthly)
          : pmt * mo;
        data.push({ year: y, value: val });
      }
      fv = rMonthly > 0
        ? pmt * ((Math.pow(1 + rMonthly, months) - 1) / rMonthly) * (1 + rMonthly)
        : pmt * months;
    }

    setFinalAmount(fv);
    setTotalInvested(invested);
    setTotalReturns(fv - invested);
    setReturnPct(invested > 0 ? ((fv - invested) / invested) * 100 : 0);
    setYearlyData(data);
    setCalculated(true);
  }, [mode, principal, monthlyInvest, returnRate, years, compFreq]);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient colors={['#a29bfe', '#6c5ce7']} style={s.hero}>
        <MaterialCommunityIcons name="chart-line" size={32} color="rgba(255,255,255,0.9)" />
        <Text style={s.heroTitle}>Investment Calculator</Text>
        <Text style={s.heroSub}>Grow your wealth with compound interest</Text>
      </LinearGradient>

      {/* Mode Toggle */}
      <View style={s.modeToggle}>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'lump' && s.modeBtnActive]}
          onPress={() => setMode('lump')}
        >
          <Ionicons name="cash-outline" size={16} color={mode === 'lump' ? '#fff' : '#636e72'} />
          <Text style={[s.modeBtnText, mode === 'lump' && s.modeBtnTextActive]}>Lump Sum</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'sip' && s.modeBtnActive]}
          onPress={() => setMode('sip')}
        >
          <Ionicons name="repeat-outline" size={16} color={mode === 'sip' ? '#fff' : '#636e72'} />
          <Text style={[s.modeBtnText, mode === 'sip' && s.modeBtnTextActive]}>Monthly SIP</Text>
        </TouchableOpacity>
      </View>

      {/* Inputs */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Investment Details</Text>
        {mode === 'lump'
          ? <InputRow label="Principal Amount (PKR)" value={principal} onChange={setPrincipal} placeholder="100000" icon="cash-outline" />
          : <InputRow label="Monthly Investment (PKR)" value={monthlyInvest} onChange={setMonthlyInvest} placeholder="5000" icon="repeat-outline" />
        }
        <InputRow label="Expected Annual Return" value={returnRate} onChange={setReturnRate} placeholder="12" suffix="%" icon="trending-up" />
        <InputRow label="Time Period" value={years} onChange={setYears} placeholder="10" suffix="yrs" icon="calendar-outline" />

        {/* Compounding Selector */}
        <View style={s.inputRow}>
          <View style={s.inputLabelRow}>
            <Ionicons name="sync-outline" size={15} color="#6c5ce7" />
            <Text style={s.inputLabel}>Compounding</Text>
          </View>
          <View style={s.compRow}>
            {(['monthly', 'quarterly', 'yearly'] as const).map(c => (
              <TouchableOpacity
                key={c}
                style={[s.compBtn, compounding === c && s.compBtnActive]}
                onPress={() => setCompounding(c)}
              >
                <Text style={[s.compBtnText, compounding === c && s.compBtnTextActive]}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={s.calcBtn} onPress={calculate}>
          <LinearGradient colors={['#a29bfe', '#6c5ce7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.calcBtnGrad}>
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={s.calcBtnText}>Calculate Returns</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {calculated && (
        <>
          <View style={s.card}>
            <View style={s.finalCard}>
              <Text style={s.finalLabel}>Final Amount</Text>
              <Text style={s.finalValue}>{fmt(finalAmount)}</Text>
              <View style={s.returnBadge}>
                <Ionicons name="trending-up" size={14} color="#6c5ce7" />
                <Text style={s.returnBadgeText}>{returnPct.toFixed(1)}% total return</Text>
              </View>
            </View>

            <View style={s.statsGrid}>
              <StatCard label="Invested" value={fmt(totalInvested)} color="#4f8cff" icon="wallet-outline" />
              <StatCard label="Returns" value={fmt(totalReturns)} color="#6c5ce7" icon="trending-up" />
              <StatCard label="Return %" value={returnPct.toFixed(1) + '%'} color="#00b894" icon="stats-chart-outline" />
              <StatCard label="Duration" value={years + ' Years'} color="#fdcb6e" icon="calendar-outline" />
            </View>

            {/* Bar Chart */}
            <Text style={[s.cardTitle, { marginTop: 16, marginBottom: 0 }]}>Year-by-Year Growth</Text>
            <GrowthChart data={yearlyData} />

            {/* Wealth Split */}
            <View style={s.splitRow}>
              <View style={s.splitBar}>
                <View style={[s.splitFill, {
                  flex: totalInvested / finalAmount,
                  backgroundColor: '#4f8cff',
                }]} />
                <View style={[s.splitFill, {
                  flex: totalReturns / finalAmount,
                  backgroundColor: '#6c5ce7',
                }]} />
              </View>
              <View style={s.splitLegend}>
                <View style={s.splitItem}>
                  <View style={[s.splitDot, { backgroundColor: '#4f8cff' }]} />
                  <Text style={s.splitText}>Invested: {((totalInvested / finalAmount) * 100).toFixed(0)}%</Text>
                </View>
                <View style={s.splitItem}>
                  <View style={[s.splitDot, { backgroundColor: '#6c5ce7' }]} />
                  <Text style={s.splitText}>Returns: {((totalReturns / finalAmount) * 100).toFixed(0)}%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Year-by-Year Table */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Yearly Breakdown</Text>
            <View style={s.table}>
              <View style={[s.tableRow, s.tableHead]}>
                <Text style={[s.cell, s.headCell]}>Year</Text>
                <Text style={[s.cell, s.headCell]}>Value</Text>
                <Text style={[s.cell, s.headCell]}>Gain</Text>
              </View>
              {yearlyData.map((d, i) => (
                <View key={i} style={[s.tableRow, i % 2 === 0 && { backgroundColor: '#fafafa' }]}>
                  <Text style={[s.cell, s.dataCell]}>Year {d.year}</Text>
                  <Text style={[s.cell, s.dataCell, { color: '#6c5ce7' }]}>
                    {Math.round(d.value).toLocaleString()}
                  </Text>
                  <Text style={[s.cell, s.dataCell, { color: '#00b894' }]}>
                    +{Math.round(d.value - (mode === 'lump' ? parseFloat(principal) : parseFloat(monthlyInvest) * d.year * 12)).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
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
  hero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 4, shadowColor: '#6c5ce7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#6c5ce7' },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: '#636e72' },
  modeBtnTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2d3436', marginBottom: 16 },
  inputRow: { marginBottom: 14 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#636e72' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#dfe6f5' },
  input: { flex: 1, fontSize: 18, fontWeight: '600', color: '#2d3436', paddingVertical: 12 },
  inputSuffix: { fontSize: 14, fontWeight: '600', color: '#636e72' },
  compRow: { flexDirection: 'row', gap: 8 },
  compBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#f8f9fa', borderWidth: 1.5, borderColor: '#dfe6f5' },
  compBtnActive: { backgroundColor: '#6c5ce7', borderColor: '#6c5ce7' },
  compBtnText: { fontSize: 12, fontWeight: '600', color: '#636e72' },
  compBtnTextActive: { color: '#fff' },
  calcBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  calcBtnGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  finalCard: { backgroundColor: '#f5f3ff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: '#a29bfe' },
  finalLabel: { fontSize: 13, color: '#636e72', fontWeight: '600' },
  finalValue: { fontSize: 32, fontWeight: '800', color: '#6c5ce7', marginVertical: 4 },
  returnBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ede9ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  returnBadgeText: { fontSize: 12, color: '#6c5ce7', fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, alignItems: 'center', borderTopWidth: 3 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#2d3436', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#636e72', marginTop: 2, textAlign: 'center' },
  splitRow: { marginTop: 16 },
  splitBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  splitFill: { height: 10 },
  splitLegend: { flexDirection: 'row', justifyContent: 'space-around' },
  splitItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  splitDot: { width: 8, height: 8, borderRadius: 4 },
  splitText: { fontSize: 12, color: '#636e72' },
  table: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' },
  tableRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 12 },
  tableHead: { backgroundColor: '#f5f3ff' },
  cell: { flex: 1 },
  headCell: { fontSize: 12, fontWeight: '700', color: '#2d3436' },
  dataCell: { fontSize: 12, color: '#636e72' },
});
