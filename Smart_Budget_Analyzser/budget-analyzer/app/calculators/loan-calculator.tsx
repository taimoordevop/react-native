import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Animated, Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';

// ─── Pie Chart ───────────────────────────────────────────────────────────────
function PieChart({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest;
  if (total === 0) return null;
  const principalPct = principal / total;
  const r = 70;
  const cx = 90;
  const cy = 90;
  const angle = principalPct * 2 * Math.PI;
  const x1 = cx + r * Math.sin(0);
  const y1 = cy - r * Math.cos(0);
  const x2 = cx + r * Math.sin(angle);
  const y2 = cy - r * Math.cos(angle);
  const largeArc = angle > Math.PI ? 1 : 0;
  const principalPath = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  const interestPath = `M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${1 - largeArc} 1 ${x1} ${y1} Z`;

  return (
    <View style={pieStyles.container}>
      <Svg width={180} height={180}>
        <G>
          <Path d={principalPath} fill="#4f8cff" />
          <Path d={interestPath} fill="#fd79a8" />
          <Circle cx={cx} cy={cy} r={40} fill="#fff" />
          <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#636e72">Interest</SvgText>
          <SvgText x={cx} y={cy + 10} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2d3436">
            {Math.round((1 - principalPct) * 100)}%
          </SvgText>
        </G>
      </Svg>
      <View style={pieStyles.legend}>
        <View style={pieStyles.legendItem}>
          <View style={[pieStyles.dot, { backgroundColor: '#4f8cff' }]} />
          <Text style={pieStyles.legendText}>Principal ({Math.round(principalPct * 100)}%)</Text>
        </View>
        <View style={pieStyles.legendItem}>
          <View style={[pieStyles.dot, { backgroundColor: '#fd79a8' }]} />
          <Text style={pieStyles.legendText}>Interest ({Math.round((1 - principalPct) * 100)}%)</Text>
        </View>
      </View>
    </View>
  );
}

const pieStyles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8 },
  legend: { flexDirection: 'row', gap: 20, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#636e72' },
});

// ─── Input Row ────────────────────────────────────────────────────────────────
function InputRow({
  label, value, onChange, placeholder, suffix, icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; suffix?: string; icon: string;
}) {
  return (
    <View style={s.inputRow}>
      <View style={s.inputLabelRow}>
        <Ionicons name={icon as any} size={16} color="#4f8cff" />
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

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <View style={[s.resultCard, { borderLeftColor: color }]}>
      <Text style={s.resultLabel}>{label}</Text>
      <Text style={[s.resultValue, { color }]}>{value}</Text>
      {sub && <Text style={s.resultSub}>{sub}</Text>}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LoanCalculator() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [inYears, setInYears] = useState(true);
  const [fee, setFee] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [processingFee, setProcessingFee] = useState(0);
  const [schedule, setSchedule] = useState<{ month: number; emi: number; interest: number; principal: number; balance: number }[]>([]);

  const fmt = (n: number) => '₨ ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 });

  const calculate = useCallback(() => {
    const P = parseFloat(principal) || 0;
    const annualRate = parseFloat(rate) || 0;
    const t = parseFloat(tenure) || 0;
    const months = inYears ? t * 12 : t;
    const r = annualRate / 12 / 100;
    const feeAmt = P * ((parseFloat(fee) || 0) / 100);

    if (P === 0 || months === 0) return;

    let emiVal: number;
    if (r === 0) {
      emiVal = P / months;
    } else {
      emiVal = (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    }

    const totalPay = emiVal * months;
    const totalInt = totalPay - P;

    setEmi(emiVal);
    setTotalInterest(totalInt);
    setTotalPayment(totalPay);
    setProcessingFee(feeAmt);

    // Build amortization schedule
    const sched = [];
    let balance = P;
    for (let m = 1; m <= Math.min(months, 60); m++) {
      const intPayment = balance * r;
      const prinPayment = emiVal - intPayment;
      balance -= prinPayment;
      sched.push({ month: m, emi: emiVal, interest: intPayment, principal: prinPayment, balance: Math.max(0, balance) });
    }
    setSchedule(sched);
    setCalculated(true);
  }, [principal, rate, tenure, inYears, fee]);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient colors={['#00b894', '#00cec9']} style={s.hero}>
        <MaterialCommunityIcons name="bank" size={32} color="rgba(255,255,255,0.9)" />
        <Text style={s.heroTitle}>Loan / EMI Calculator</Text>
        <Text style={s.heroSub}>Calculate your monthly installments</Text>
      </LinearGradient>

      {/* Inputs */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Loan Details</Text>
        <InputRow label="Loan Amount (PKR)" value={principal} onChange={setPrincipal} placeholder="500000" icon="cash-outline" />
        <InputRow label="Annual Interest Rate" value={rate} onChange={setRate} placeholder="12" suffix="%" icon="trending-up" />

        <View style={s.inputRow}>
          <View style={s.inputLabelRow}>
            <Ionicons name="calendar-outline" size={16} color="#4f8cff" />
            <Text style={s.inputLabel}>Loan Tenure</Text>
            <View style={s.tenureToggle}>
              <TouchableOpacity onPress={() => setInYears(true)} style={[s.toggleBtn, inYears && s.toggleActive]}>
                <Text style={[s.toggleText, inYears && s.toggleTextActive]}>Years</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setInYears(false)} style={[s.toggleBtn, !inYears && s.toggleActive]}>
                <Text style={[s.toggleText, !inYears && s.toggleTextActive]}>Months</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.inputBox}>
            <TextInput
              style={s.input}
              value={tenure}
              onChangeText={t => setTenure(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder={inYears ? "5" : "60"}
              placeholderTextColor="#b2bec3"
            />
            <Text style={s.inputSuffix}>{inYears ? 'yrs' : 'mo'}</Text>
          </View>
        </View>

        <InputRow label="Processing Fee" value={fee} onChange={setFee} placeholder="1" suffix="%" icon="receipt-outline" />

        <TouchableOpacity style={s.calcBtn} onPress={calculate}>
          <LinearGradient colors={['#00b894', '#00cec9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.calcBtnGrad}>
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={s.calcBtnText}>Calculate EMI</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {calculated && (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>Results</Text>
            <View style={s.emiHighlight}>
              <Text style={s.emiLabel}>Monthly EMI</Text>
              <Text style={s.emiValue}>{fmt(emi)}</Text>
              <Text style={s.emiSub}>per month for {inYears ? tenure + ' years' : tenure + ' months'}</Text>
            </View>

            <View style={s.resultsGrid}>
              <ResultCard label="Total Interest" value={fmt(totalInterest)} color="#fd79a8" />
              <ResultCard label="Total Payment" value={fmt(totalPayment)} color="#4f8cff" />
              <ResultCard label="Processing Fee" value={fmt(processingFee)} color="#fdcb6e" />
              <ResultCard label="Grand Total" value={fmt(totalPayment + processingFee)} color="#00b894" />
            </View>

            {/* Pie Chart */}
            <PieChart principal={parseFloat(principal) || 0} interest={totalInterest} />
          </View>

          {/* Amortization Schedule */}
          <View style={s.card}>
            <TouchableOpacity style={s.scheduleHeader} onPress={() => setShowSchedule(!showSchedule)}>
              <Text style={s.cardTitle}>Amortization Schedule</Text>
              <View style={s.scheduleBadge}>
                <Text style={s.scheduleBadgeText}>{Math.min(schedule.length, 60)} rows</Text>
              </View>
              <Ionicons name={showSchedule ? 'chevron-up' : 'chevron-down'} size={18} color="#636e72" />
            </TouchableOpacity>

            {showSchedule && (
              <View style={s.table}>
                <View style={[s.tableRow, s.tableHead]}>
                  <Text style={[s.tableCell, s.tableHeadText, { flex: 0.5 }]}>Mo.</Text>
                  <Text style={[s.tableCell, s.tableHeadText]}>EMI</Text>
                  <Text style={[s.tableCell, s.tableHeadText]}>Principal</Text>
                  <Text style={[s.tableCell, s.tableHeadText]}>Interest</Text>
                  <Text style={[s.tableCell, s.tableHeadText]}>Balance</Text>
                </View>
                {schedule.map(row => (
                  <View key={row.month} style={[s.tableRow, row.month % 2 === 0 && s.tableRowAlt]}>
                    <Text style={[s.tableCell, s.tableCellText, { flex: 0.5 }]}>{row.month}</Text>
                    <Text style={[s.tableCell, s.tableCellText]}>{Math.round(row.emi).toLocaleString()}</Text>
                    <Text style={[s.tableCell, s.tableCellText, { color: '#4f8cff' }]}>{Math.round(row.principal).toLocaleString()}</Text>
                    <Text style={[s.tableCell, s.tableCellText, { color: '#fd79a8' }]}>{Math.round(row.interest).toLocaleString()}</Text>
                    <Text style={[s.tableCell, s.tableCellText]}>{Math.round(row.balance).toLocaleString()}</Text>
                  </View>
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
  hero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 4, shadowColor: '#00b894', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2d3436', marginBottom: 16 },
  inputRow: { marginBottom: 14 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#636e72', flex: 1 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#dfe6f5' },
  input: { flex: 1, fontSize: 18, fontWeight: '600', color: '#2d3436', paddingVertical: 12 },
  inputSuffix: { fontSize: 14, fontWeight: '600', color: '#636e72' },
  tenureToggle: { flexDirection: 'row', backgroundColor: '#f0f4ff', borderRadius: 8, padding: 2, marginLeft: 'auto' },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  toggleActive: { backgroundColor: '#4f8cff' },
  toggleText: { fontSize: 12, color: '#636e72', fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  calcBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  calcBtnGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emiHighlight: { backgroundColor: '#f0fff8', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: '#00b894' },
  emiLabel: { fontSize: 13, color: '#636e72', fontWeight: '600' },
  emiValue: { fontSize: 34, fontWeight: '800', color: '#00b894', marginVertical: 4 },
  emiSub: { fontSize: 12, color: '#636e72' },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  resultCard: { width: '47%', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, borderLeftWidth: 4 },
  resultLabel: { fontSize: 12, color: '#636e72', marginBottom: 4 },
  resultValue: { fontSize: 16, fontWeight: '700' },
  resultSub: { fontSize: 11, color: '#b2bec3', marginTop: 2 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleBadge: { backgroundColor: '#f0f4ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  scheduleBadgeText: { fontSize: 11, color: '#4f8cff', fontWeight: '600' },
  table: { marginTop: 14, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10 },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableHead: { backgroundColor: '#f0f4ff' },
  tableCell: { flex: 1, fontSize: 11 },
  tableHeadText: { fontWeight: '700', color: '#2d3436' },
  tableCellText: { color: '#636e72' },
});
