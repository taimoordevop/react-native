import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';

// ─── Progress Timeline Chart ──────────────────────────────────────────────────
function TimelineChart({ milestones }: { milestones: { label: string; month: number; amount: number; totalMonths: number }[] }) {
  if (!milestones.length) return null;
  const W = 300; const H = 80; const PAD = 20;
  const usable = W - PAD * 2;

  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Svg width={W} height={H + 30}>
        <Line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#dfe6e9" strokeWidth={3} strokeLinecap="round" />
        {milestones.map((m, i) => {
          const x = PAD + (m.month / m.totalMonths) * usable;
          const colors = ['#4f8cff', '#fdcb6e', '#00b894', '#6c5ce7'];
          const col = colors[i % colors.length];
          return (
            <React.Fragment key={i}>
              <Circle cx={x} cy={H / 2} r={8} fill={col} />
              <Circle cx={x} cy={H / 2} r={5} fill="#fff" />
              <SvgText x={x} y={H / 2 - 16} textAnchor="middle" fontSize="9" fill={col} fontWeight="bold">
                {m.label}
              </SvgText>
              <SvgText x={x} y={H / 2 + 22} textAnchor="middle" fontSize="8" fill="#636e72">
                Mo {m.month}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Circle cx={PAD} cy={H / 2} r={6} fill="#4f8cff" />
        <Circle cx={W - PAD} cy={H / 2} r={6} fill="#00b894" />
      </Svg>
    </View>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function GoalProgress({ current, goal }: { current: number; goal: number }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  return (
    <View style={ps.wrap}>
      <View style={ps.topRow}>
        <Text style={ps.label}>Current Progress</Text>
        <Text style={ps.pct}>{pct.toFixed(1)}%</Text>
      </View>
      <View style={ps.bar}>
        <View style={[ps.fill, { width: `${pct}%` as any }]} />
      </View>
      <View style={ps.botRow}>
        <Text style={ps.bot}>₨{Math.round(current).toLocaleString()}</Text>
        <Text style={ps.bot}>₨{Math.round(goal).toLocaleString()}</Text>
      </View>
    </View>
  );
}
const ps = StyleSheet.create({
  wrap: { marginBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: '#636e72', fontWeight: '600' },
  pct: { fontSize: 13, fontWeight: '700', color: '#55efc4' },
  bar: { height: 10, backgroundColor: '#f0f0f0', borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, backgroundColor: '#55efc4', borderRadius: 5 },
  botRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  bot: { fontSize: 11, color: '#636e72' },
});

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, suffix, icon, color = '#00b894' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; suffix?: string; icon: string; color?: string;
}) {
  return (
    <View style={s.fieldWrap}>
      <View style={s.fieldLabel}>
        <Ionicons name={icon as any} size={15} color={color} />
        <Text style={s.labelText}>{label}</Text>
      </View>
      <View style={s.fieldBox}>
        <TextInput
          style={s.fieldInput}
          value={value}
          onChangeText={t => onChange(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor="#b2bec3"
        />
        {suffix && <Text style={s.fieldSuffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SavingsGoal() {
  const [mode, setMode] = useState<'howlong' | 'howmuch'>('howlong');
  const [goalAmount, setGoalAmount] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlyContrib, setMonthlyContrib] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [targetMonths, setTargetMonths] = useState('');
  const [goalName, setGoalName] = useState('');
  const [calculated, setCalculated] = useState(false);

  const [result, setResult] = useState({
    months: 0, years: 0, remainingMonths: 0,
    totalContribs: 0, interestEarned: 0, finalAmount: 0,
    monthlyNeeded: 0,
    milestones: [] as { label: string; month: number; amount: number; totalMonths: number }[],
    yearlyData: [] as { year: number; balance: number }[],
  });

  const fmt = (n: number) => '₨ ' + Math.round(n).toLocaleString('en-PK');

  const calculate = useCallback(() => {
    const goal = parseFloat(goalAmount) || 0;
    const current = parseFloat(currentSavings) || 0;
    const monthly = parseFloat(monthlyContrib) || 0;
    const r = (parseFloat(annualRate) || 0) / 100 / 12;

    if (mode === 'howlong') {
      let balance = current;
      let months = 0;
      const yearly: { year: number; balance: number }[] = [];
      while (balance < goal && months < 1200) {
        balance = balance * (1 + r) + monthly;
        months++;
        if (months % 12 === 0) yearly.push({ year: months / 12, balance });
      }
      const totalContribs = monthly * months;
      const interestEarned = balance - current - totalContribs;

      // Milestones at 25/50/75/100%
      const milestonesData: typeof result.milestones = [];
      let bal2 = current; let mo2 = 0;
      const pcts = [0.25, 0.5, 0.75, 1.0];
      let pctIdx = 0;
      while (mo2 < months && pctIdx < pcts.length) {
        bal2 = bal2 * (1 + r) + monthly;
        mo2++;
        if (bal2 >= goal * pcts[pctIdx]) {
          milestonesData.push({ label: `${pcts[pctIdx] * 100}%`, month: mo2, amount: bal2, totalMonths: months });
          pctIdx++;
        }
      }

      setResult({
        months, years: Math.floor(months / 12), remainingMonths: months % 12,
        totalContribs, interestEarned, finalAmount: balance,
        monthlyNeeded: 0,
        milestones: milestonesData,
        yearlyData: yearly,
      });
    } else {
      // How much monthly to reach goal in X months
      const n = parseFloat(targetMonths) || 1;
      let needed: number;
      if (r === 0) {
        needed = (goal - current) / n;
      } else {
        const fvCurrent = current * Math.pow(1 + r, n);
        const fvFactor = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        needed = (goal - fvCurrent) / fvFactor;
      }
      const totalContribs = Math.max(0, needed) * n;
      const interestEarned = goal - current - totalContribs;

      const yearly: { year: number; balance: number }[] = [];
      let bal = current;
      for (let m = 1; m <= n; m++) {
        bal = bal * (1 + r) + Math.max(0, needed);
        if (m % 12 === 0) yearly.push({ year: m / 12, balance: bal });
      }

      setResult({
        months: n, years: Math.floor(n / 12), remainingMonths: n % 12,
        totalContribs, interestEarned: Math.max(0, interestEarned),
        finalAmount: goal,
        monthlyNeeded: Math.max(0, needed),
        milestones: [],
        yearlyData: yearly,
      });
    }
    setCalculated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, goalAmount, currentSavings, monthlyContrib, annualRate, targetMonths]);

  const PRESET_GOALS = [
    { name: 'Emergency Fund', icon: 'shield', amount: '300000', color: '#4f8cff' },
    { name: 'New Car', icon: 'car', amount: '2000000', color: '#fdcb6e' },
    { name: 'Wedding', icon: 'heart', amount: '1000000', color: '#fd79a8' },
    { name: 'House Down Payment', icon: 'home', amount: '5000000', color: '#00b894' },
    { name: 'Education', icon: 'school', amount: '800000', color: '#6c5ce7' },
    { name: 'Hajj / Umrah', icon: 'moon', amount: '600000', color: '#e17055' },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient colors={['#55efc4', '#00b894']} style={s.hero}>
        <MaterialCommunityIcons name="bullseye-arrow" size={32} color="rgba(255,255,255,0.95)" />
        <Text style={s.heroTitle}>Savings Goal Calculator</Text>
        <Text style={s.heroSub}>Plan your path to financial goals</Text>
      </LinearGradient>

      {/* Preset Goals */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Quick Goal Presets</Text>
        <View style={s.presetGrid}>
          {PRESET_GOALS.map(p => (
            <TouchableOpacity
              key={p.name}
              style={[s.presetCard, goalAmount === p.amount && { borderColor: p.color, borderWidth: 2 }]}
              onPress={() => { setGoalAmount(p.amount); setGoalName(p.name); }}
            >
              <Ionicons name={p.icon as any} size={20} color={p.color} />
              <Text style={s.presetName}>{p.name}</Text>
              <Text style={[s.presetAmount, { color: p.color }]}>
                ₨{parseInt(p.amount).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mode */}
      <View style={s.modeWrap}>
        <TouchableOpacity style={[s.modeBtn, mode === 'howlong' && s.modeBtnActive]} onPress={() => setMode('howlong')}>
          <Ionicons name="time-outline" size={16} color={mode === 'howlong' ? '#fff' : '#636e72'} />
          <Text style={[s.modeBtnText, mode === 'howlong' && { color: '#fff' }]}>How Long?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.modeBtn, mode === 'howmuch' && s.modeBtnActive]} onPress={() => setMode('howmuch')}>
          <Ionicons name="cash-outline" size={16} color={mode === 'howmuch' ? '#fff' : '#636e72'} />
          <Text style={[s.modeBtnText, mode === 'howmuch' && { color: '#fff' }]}>How Much/Month?</Text>
        </TouchableOpacity>
      </View>

      {/* Inputs */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Goal Details</Text>

        {/* Goal Name */}
        <View style={s.fieldWrap}>
          <View style={s.fieldLabel}>
            <Ionicons name="flag-outline" size={15} color="#00b894" />
            <Text style={s.labelText}>Goal Name</Text>
          </View>
          <View style={s.fieldBox}>
            <TextInput
              style={[s.fieldInput, { fontSize: 16 }]}
              value={goalName}
              onChangeText={setGoalName}
              placeholder="e.g. Dream Car"
              placeholderTextColor="#b2bec3"
            />
          </View>
        </View>

        <Field label="Target Goal Amount (PKR)" value={goalAmount} onChange={setGoalAmount} placeholder="500000" icon="trophy-outline" />
        <Field label="Current Savings (PKR)" value={currentSavings} onChange={setCurrentSavings} placeholder="50000" icon="wallet-outline" />

        {mode === 'howlong'
          ? <Field label="Monthly Contribution (PKR)" value={monthlyContrib} onChange={setMonthlyContrib} placeholder="10000" icon="repeat-outline" />
          : <Field label="Time to Goal (Months)" value={targetMonths} onChange={setTargetMonths} placeholder="24" suffix="mo" icon="calendar-outline" />
        }

        <Field label="Annual Interest Rate" value={annualRate} onChange={setAnnualRate} placeholder="8" suffix="%" icon="trending-up" />

        {currentSavings && goalAmount && (
          <GoalProgress current={parseFloat(currentSavings) || 0} goal={parseFloat(goalAmount) || 0} />
        )}

        <TouchableOpacity style={s.calcBtn} onPress={calculate}>
          <LinearGradient colors={['#55efc4', '#00b894']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.calcBtnGrad}>
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={s.calcBtnText}>
              {mode === 'howlong' ? 'Calculate Time to Goal' : 'Calculate Monthly Savings'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {calculated && (
        <>
          <View style={s.card}>
            <Text style={s.cardTitle}>Results for {'“'}{goalName}{'”'}</Text>

            {/* Main Result */}
            <LinearGradient colors={['#55efc4', '#00b894']} style={s.resultHighlight}>
              {mode === 'howlong' ? (
                <>
                  <Text style={s.resultHighlightLabel}>Time to Reach Goal</Text>
                  <Text style={s.resultHighlightValue}>
                    {result.years > 0 ? `${result.years}y ` : ''}{result.remainingMonths}m
                  </Text>
                  <Text style={s.resultHighlightSub}>{result.months} months total</Text>
                </>
              ) : (
                <>
                  <Text style={s.resultHighlightLabel}>Monthly Savings Needed</Text>
                  <Text style={s.resultHighlightValue}>{fmt(result.monthlyNeeded)}</Text>
                  <Text style={s.resultHighlightSub}>for {result.months} months</Text>
                </>
              )}
            </LinearGradient>

            {/* Stats */}
            <View style={s.statsGrid}>
              {[
                { label: 'Goal Amount', value: fmt(parseFloat(goalAmount) || 0), color: '#00b894', icon: 'trophy-outline' },
                { label: 'Current Savings', value: fmt(parseFloat(currentSavings) || 0), color: '#4f8cff', icon: 'wallet-outline' },
                { label: 'Total Contributions', value: fmt(result.totalContribs), color: '#fdcb6e', icon: 'repeat-outline' },
                { label: 'Interest Earned', value: fmt(result.interestEarned), color: '#6c5ce7', icon: 'trending-up' },
              ].map((item, i) => (
                <View key={i} style={[s.statCard, { borderTopColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} style={{ marginBottom: 4 }} />
                  <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={s.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Timeline */}
            {result.milestones.length > 0 && (
              <>
                <Text style={[s.cardTitle, { marginTop: 16, marginBottom: 4 }]}>Milestone Timeline</Text>
                <TimelineChart milestones={result.milestones} />
                <View style={s.milestoneList}>
                  {result.milestones.map((m, i) => (
                    <View key={i} style={s.milestoneRow}>
                      <View style={[s.milestoneDot, { backgroundColor: ['#4f8cff', '#fdcb6e', '#00b894', '#6c5ce7'][i] }]} />
                      <Text style={s.milestoneLbl}>{m.label} reached</Text>
                      <Text style={s.milestoneVal}>Month {m.month}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Year-by-Year */}
          {result.yearlyData.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Year-by-Year Progress</Text>
              <View style={s.table}>
                <View style={[s.tableRow, s.tableHead]}>
                  <Text style={[s.cell, s.headCell]}>Year</Text>
                  <Text style={[s.cell, s.headCell]}>Balance</Text>
                  <Text style={[s.cell, s.headCell]}>Progress</Text>
                </View>
                {result.yearlyData.map((row, i) => {
                  const goalAmt = parseFloat(goalAmount) || 1;
                  const pct = Math.min((row.balance / goalAmt) * 100, 100);
                  return (
                    <View key={i} style={[s.tableRow, i % 2 === 0 && { backgroundColor: '#fafafa' }]}>
                      <Text style={[s.cell, s.dataCell]}>Year {row.year}</Text>
                      <Text style={[s.cell, s.dataCell, { color: '#00b894', fontWeight: '700' }]}>
                        ₨{Math.round(row.balance).toLocaleString()}
                      </Text>
                      <View style={[s.cell, { justifyContent: 'center' }]}>
                        <View style={s.miniBar}>
                          <View style={[s.miniFill, { width: `${pct}%` as any }]} />
                        </View>
                        <Text style={s.miniPct}>{pct.toFixed(0)}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* What-If */}
          <View style={s.card}>
            <Text style={s.cardTitle}>What-If Scenarios</Text>
            {[1.2, 1.5, 2.0].map(multiplier => {
              const newMonthly = mode === 'howlong'
                ? parseFloat(monthlyContrib) * multiplier
                : result.monthlyNeeded * multiplier;
              const r2 = (parseFloat(annualRate) || 0) / 100 / 12;
              let bal = parseFloat(currentSavings) || 0;
              let mo = 0;
              const goalAmt = parseFloat(goalAmount) || 0;
              while (bal < goalAmt && mo < 1200) { bal = bal * (1 + r2) + newMonthly; mo++; }
              return (
                <View key={multiplier} style={s.whatIfRow}>
                  <View style={s.whatIfLeft}>
                    <Text style={s.whatIfLabel}>
                      If you save {multiplier === 1.2 ? '20%' : multiplier === 1.5 ? '50%' : '2×'} more
                    </Text>
                    <Text style={s.whatIfAmount}>₨{Math.round(newMonthly).toLocaleString()}/mo</Text>
                  </View>
                  <View style={s.whatIfRight}>
                    <Text style={s.whatIfTime}>{Math.floor(mo / 12)}y {mo % 12}m</Text>
                    <Text style={s.whatIfSave}>
                      Save {result.months - mo > 0 ? result.months - mo : 0} months!
                    </Text>
                  </View>
                </View>
              );
            })}
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
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetCard: { width: '30%', backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#f0f0f0' },
  presetName: { fontSize: 10, color: '#636e72', fontWeight: '600', textAlign: 'center' },
  presetAmount: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  modeWrap: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#00b894' },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: '#636e72' },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  labelText: { fontSize: 13, fontWeight: '600', color: '#636e72' },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#dfe6f5' },
  fieldInput: { flex: 1, fontSize: 18, fontWeight: '600', color: '#2d3436', paddingVertical: 12 },
  fieldSuffix: { fontSize: 14, fontWeight: '600', color: '#636e72' },
  calcBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  calcBtnGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultHighlight: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  resultHighlightLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  resultHighlightValue: { fontSize: 34, fontWeight: '800', color: '#fff', marginVertical: 4 },
  resultHighlightSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, alignItems: 'center', borderTopWidth: 3 },
  statValue: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#636e72', textAlign: 'center' },
  milestoneList: { gap: 8 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  milestoneDot: { width: 10, height: 10, borderRadius: 5 },
  milestoneLbl: { flex: 1, fontSize: 13, color: '#2d3436' },
  milestoneVal: { fontSize: 13, fontWeight: '700', color: '#00b894' },
  table: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' },
  tableRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 12, alignItems: 'center' },
  tableHead: { backgroundColor: '#f0fff8' },
  cell: { flex: 1 },
  headCell: { fontSize: 12, fontWeight: '700', color: '#2d3436' },
  dataCell: { fontSize: 12, color: '#636e72' },
  miniBar: { height: 5, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  miniFill: { height: 5, backgroundColor: '#00b894', borderRadius: 3 },
  miniPct: { fontSize: 10, color: '#00b894', marginTop: 2 },
  whatIfRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8f9fa' },
  whatIfLeft: { flex: 1 },
  whatIfLabel: { fontSize: 13, color: '#2d3436', fontWeight: '600' },
  whatIfAmount: { fontSize: 12, color: '#636e72', marginTop: 2 },
  whatIfRight: { alignItems: 'flex-end' },
  whatIfTime: { fontSize: 15, fontWeight: '700', color: '#00b894' },
  whatIfSave: { fontSize: 11, color: '#4f8cff', marginTop: 2 },
});
