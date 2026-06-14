import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ needs, wants, savings }: { needs: number; wants: number; savings: number }) {
  const total = needs + wants + savings;
  if (total === 0) return null;
  const cx = 90; const cy = 90; const r = 70; const inner = 44;
  const segments = [
    { value: needs / total, color: '#4f8cff', label: 'Needs' },
    { value: wants / total, color: '#fdcb6e', label: 'Wants' },
    { value: savings / total, color: '#00b894', label: 'Savings' },
  ];

  let currentAngle = -Math.PI / 2;
  const paths = segments.map(seg => {
    const start = currentAngle;
    const end = currentAngle + seg.value * 2 * Math.PI;
    currentAngle = end;
    const x1 = cx + r * Math.cos(start); const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end); const y2 = cy + r * Math.sin(end);
    const xi1 = cx + inner * Math.cos(start); const yi1 = cy + inner * Math.sin(start);
    const xi2 = cx + inner * Math.cos(end); const yi2 = cy + inner * Math.sin(end);
    const largeArc = seg.value > 0.5 ? 1 : 0;
    return `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;
  });

  return (
    <View style={donutS.wrap}>
      <Svg width={180} height={180}>
        <G>
          {paths.map((d, i) => <Path key={i} d={d} fill={segments[i].color} />)}
          <Circle cx={cx} cy={cy} r={inner} fill="#fff" />
          <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#636e72">50/30/20</SvgText>
          <SvgText x={cx} y={cy + 10} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2d3436">Rule</SvgText>
        </G>
      </Svg>
      <View style={donutS.legend}>
        {segments.map((seg, i) => (
          <View key={i} style={donutS.item}>
            <View style={[donutS.dot, { backgroundColor: seg.color }]} />
            <Text style={donutS.label}>{seg.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const donutS = StyleSheet.create({
  wrap: { alignItems: 'center' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  label: { fontSize: 12, color: '#636e72' },
});

// ─── Category Row ─────────────────────────────────────────────────────────────
function CategoryRow({ icon, label, budget, actual, color }: {
  icon: string; label: string; budget: number; actual?: number; color: string;
}) {
  const pct = actual !== undefined && budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
  const over = actual !== undefined && actual > budget;
  return (
    <View style={catS.row}>
      <View style={[catS.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <View style={catS.info}>
        <View style={catS.topRow}>
          <Text style={catS.label}>{label}</Text>
          <Text style={[catS.amount, { color }]}>₨{Math.round(budget).toLocaleString()}</Text>
        </View>
        {actual !== undefined && (
          <>
            <View style={catS.barBg}>
              <View style={[catS.barFill, { width: `${pct}%` as any, backgroundColor: over ? '#d63031' : color }]} />
            </View>
            <Text style={[catS.actualText, over && { color: '#d63031' }]}>
              Actual: ₨{Math.round(actual).toLocaleString()} {over ? '⚠️ Over budget!' : ''}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
const catS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 13, fontWeight: '600', color: '#2d3436' },
  amount: { fontSize: 13, fontWeight: '700' },
  barBg: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, marginBottom: 3 },
  barFill: { height: 6, borderRadius: 3 },
  actualText: { fontSize: 11, color: '#636e72' },
});

// ─── Need categories ──────────────────────────────────────────────────────────
const NEED_CATS = [
  { icon: 'home-outline', label: 'Rent / Mortgage', pct: 0.25 },
  { icon: 'flash-outline', label: 'Utilities', pct: 0.05 },
  { icon: 'cart-outline', label: 'Groceries', pct: 0.10 },
  { icon: 'car-outline', label: 'Transport', pct: 0.07 },
  { icon: 'medkit-outline', label: 'Insurance/Health', pct: 0.03 },
];
const WANT_CATS = [
  { icon: 'restaurant-outline', label: 'Dining Out', pct: 0.10 },
  { icon: 'game-controller-outline', label: 'Entertainment', pct: 0.08 },
  { icon: 'shirt-outline', label: 'Shopping', pct: 0.07 },
  { icon: 'phone-portrait-outline', label: 'Subscriptions', pct: 0.05 },
];
const SAVE_CATS = [
  { icon: 'shield-outline', label: 'Emergency Fund', pct: 0.10 },
  { icon: 'trending-up-outline', label: 'Investments', pct: 0.05 },
  { icon: 'flag-outline', label: 'Goals / Dreams', pct: 0.05 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BudgetPlanner() {
  const [income, setIncome] = useState('');
  const [needsPct, setNeedsPct] = useState('50');
  const [wantsPct, setWantsPct] = useState('30');
  const [savingsPct, setSavingsPct] = useState('20');
  const [showActual, setShowActual] = useState(false);
  const [actualNeeds, setActualNeeds] = useState('');
  const [actualWants, setActualWants] = useState('');
  const [actualSavings, setActualSavings] = useState('');
  const [calculated, setCalculated] = useState(false);

  const [needsBudget, setNeedsBudget] = useState(0);
  const [wantsBudget, setWantsBudget] = useState(0);
  const [savingsBudget, setSavingsBudget] = useState(0);

  const totalPct = (parseFloat(needsPct) || 0) + (parseFloat(wantsPct) || 0) + (parseFloat(savingsPct) || 0);

  const calculate = useCallback(() => {
    const inc = parseFloat(income) || 0;
    const n = (parseFloat(needsPct) || 0) / 100;
    const w = (parseFloat(wantsPct) || 0) / 100;
    const sv = (parseFloat(savingsPct) || 0) / 100;
    setNeedsBudget(inc * n);
    setWantsBudget(inc * w);
    setSavingsBudget(inc * sv);
    setCalculated(true);
  }, [income, needsPct, wantsPct, savingsPct]);

  const fmt = (n: number) => '₨ ' + Math.round(n).toLocaleString('en-PK');
  const inc = parseFloat(income) || 0;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <LinearGradient colors={['#fdcb6e', '#e17055']} style={s.hero}>
        <MaterialCommunityIcons name="piggy-bank" size={32} color="rgba(255,255,255,0.95)" />
        <Text style={s.heroTitle}>Budget Planner</Text>
        <Text style={s.heroSub}>Smart budgeting with the 50/30/20 rule</Text>
      </LinearGradient>

      {/* Income Input */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Monthly Income</Text>
        <View style={s.incomeBox}>
          <Text style={s.incomeSymbol}>₨</Text>
          <TextInput
            style={s.incomeInput}
            value={income}
            onChangeText={t => setIncome(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="80000"
            placeholderTextColor="#b2bec3"
          />
        </View>

        {/* Ratio Sliders */}
        <Text style={[s.cardTitle, { marginTop: 18, marginBottom: 12 }]}>Budget Ratios</Text>
        <View style={[s.ratioWarning, totalPct !== 100 && { backgroundColor: '#fff5f5', borderColor: '#d63031' }]}>
          <Ionicons name={totalPct === 100 ? 'checkmark-circle' : 'warning'} size={16} color={totalPct === 100 ? '#00b894' : '#d63031'} />
          <Text style={[s.ratioWarningText, totalPct !== 100 && { color: '#d63031' }]}>
            Total: {totalPct}% {totalPct !== 100 ? `(must equal 100%)` : '✓ Perfect!'}
          </Text>
        </View>

        {[
          { label: 'Needs (Essentials)', value: needsPct, set: setNeedsPct, color: '#4f8cff', icon: 'home-outline' },
          { label: 'Wants (Lifestyle)', value: wantsPct, set: setWantsPct, color: '#fdcb6e', icon: 'happy-outline' },
          { label: 'Savings & Debt', value: savingsPct, set: setSavingsPct, color: '#00b894', icon: 'trending-up' },
        ].map(item => (
          <View key={item.label} style={s.ratioRow}>
            <View style={[s.ratioIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={16} color={item.color} />
            </View>
            <Text style={s.ratioLabel}>{item.label}</Text>
            <View style={s.ratioInputBox}>
              <TextInput
                style={[s.ratioInput, { color: item.color }]}
                value={item.value}
                onChangeText={t => item.set(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={s.ratioSymbol}>%</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={s.calcBtn} onPress={calculate} disabled={totalPct !== 100}>
          <LinearGradient
            colors={totalPct === 100 ? ['#fdcb6e', '#e17055'] : ['#dfe6e9', '#b2bec3']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.calcBtnGrad}
          >
            <Ionicons name="pie-chart" size={20} color="#fff" />
            <Text style={s.calcBtnText}>Plan My Budget</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {calculated && (
        <>
          {/* Donut */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Budget Breakdown</Text>
            <DonutChart needs={needsBudget} wants={wantsBudget} savings={savingsBudget} />

            <View style={s.bucketRow}>
              {[
                { label: 'Needs', amount: needsBudget, color: '#4f8cff', pct: needsPct },
                { label: 'Wants', amount: wantsBudget, color: '#fdcb6e', pct: wantsPct },
                { label: 'Savings', amount: savingsBudget, color: '#00b894', pct: savingsPct },
              ].map(b => (
                <View key={b.label} style={[s.bucketCard, { borderTopColor: b.color }]}>
                  <Text style={[s.bucketPct, { color: b.color }]}>{b.pct}%</Text>
                  <Text style={s.bucketAmount}>{fmt(b.amount)}</Text>
                  <Text style={s.bucketLabel}>{b.label}</Text>
                </View>
              ))}
            </View>

            {/* Daily / Weekly */}
            <View style={s.extraRow}>
              <View style={s.extraCard}>
                <Text style={s.extraLabel}>Daily Budget</Text>
                <Text style={s.extraValue}>₨{Math.round(inc / 30).toLocaleString()}</Text>
              </View>
              <View style={s.extraCard}>
                <Text style={s.extraLabel}>Weekly Budget</Text>
                <Text style={s.extraValue}>₨{Math.round(inc / 4.33).toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Actual vs Budget */}
          <View style={s.card}>
            <TouchableOpacity style={s.actualToggle} onPress={() => setShowActual(!showActual)}>
              <Ionicons name="swap-horizontal" size={18} color="#e17055" />
              <Text style={s.actualToggleText}>Compare with Actual Spending</Text>
              <Ionicons name={showActual ? 'chevron-up' : 'chevron-down'} size={16} color="#636e72" />
            </TouchableOpacity>
            {showActual && (
              <View style={{ marginTop: 14, gap: 10 }}>
                {[
                  { label: 'Actual Needs (PKR)', value: actualNeeds, set: setActualNeeds, budget: needsBudget, color: '#4f8cff' },
                  { label: 'Actual Wants (PKR)', value: actualWants, set: setActualWants, budget: wantsBudget, color: '#fdcb6e' },
                  { label: 'Actual Savings (PKR)', value: actualSavings, set: setActualSavings, budget: savingsBudget, color: '#00b894' },
                ].map(item => (
                  <View key={item.label}>
                    <Text style={s.actualInputLabel}>{item.label}</Text>
                    <View style={s.actualInputBox}>
                      <TextInput
                        style={s.actualInput}
                        value={item.value}
                        onChangeText={t => item.set(t.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder={Math.round(item.budget).toString()}
                        placeholderTextColor="#b2bec3"
                      />
                    </View>
                    {item.value !== '' && (
                      <View style={[s.diffBadge, {
                        backgroundColor: parseFloat(item.value) > item.budget ? '#fff5f5' : '#f0fff8'
                      }]}>
                        <Ionicons
                          name={parseFloat(item.value) > item.budget ? 'arrow-up' : 'arrow-down'}
                          size={12}
                          color={parseFloat(item.value) > item.budget ? '#d63031' : '#00b894'}
                        />
                        <Text style={{ fontSize: 12, color: parseFloat(item.value) > item.budget ? '#d63031' : '#00b894', fontWeight: '600' }}>
                          {parseFloat(item.value) > item.budget
                            ? `₨${Math.round(parseFloat(item.value) - item.budget).toLocaleString()} over budget`
                            : `₨${Math.round(item.budget - parseFloat(item.value)).toLocaleString()} under budget`
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Category suggestions */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Suggested Category Breakdown</Text>
            <Text style={s.sectionHead}>🏠 Needs ({needsPct}%) — {fmt(needsBudget)}</Text>
            {NEED_CATS.map(c => <CategoryRow key={c.label} {...c} budget={needsBudget * c.pct / 0.5} color="#4f8cff" />)}
            <Text style={[s.sectionHead, { marginTop: 8 }]}>😊 Wants ({wantsPct}%) — {fmt(wantsBudget)}</Text>
            {WANT_CATS.map(c => <CategoryRow key={c.label} {...c} budget={wantsBudget * c.pct / 0.3} color="#fdcb6e" />)}
            <Text style={[s.sectionHead, { marginTop: 8 }]}>💰 Savings ({savingsPct}%) — {fmt(savingsBudget)}</Text>
            {SAVE_CATS.map(c => <CategoryRow key={c.label} {...c} budget={savingsBudget * c.pct / 0.2} color="#00b894" />)}
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
  hero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 4, shadowColor: '#e17055', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2d3436', marginBottom: 16 },
  incomeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 14, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#dfe6f5' },
  incomeSymbol: { fontSize: 22, fontWeight: '700', color: '#fdcb6e', marginRight: 8 },
  incomeInput: { flex: 1, fontSize: 26, fontWeight: '700', color: '#2d3436', paddingVertical: 14 },
  ratioWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fff8', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#00b894' },
  ratioWarningText: { fontSize: 13, fontWeight: '600', color: '#00b894' },
  ratioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  ratioIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  ratioLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#2d3436' },
  ratioInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1.5, borderColor: '#dfe6f5', minWidth: 64 },
  ratioInput: { fontSize: 18, fontWeight: '700', textAlign: 'right', minWidth: 36 },
  ratioSymbol: { fontSize: 16, fontWeight: '600', color: '#636e72', marginLeft: 2 },
  calcBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  calcBtnGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bucketRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  bucketCard: { flex: 1, backgroundColor: '#f8f9fa', borderRadius: 14, padding: 14, alignItems: 'center', borderTopWidth: 3 },
  bucketPct: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  bucketAmount: { fontSize: 13, fontWeight: '700', color: '#2d3436', textAlign: 'center' },
  bucketLabel: { fontSize: 11, color: '#636e72', marginTop: 2 },
  extraRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  extraCard: { flex: 1, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, alignItems: 'center' },
  extraLabel: { fontSize: 12, color: '#636e72' },
  extraValue: { fontSize: 16, fontWeight: '700', color: '#2d3436', marginTop: 4 },
  actualToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actualToggleText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#e17055' },
  actualInputLabel: { fontSize: 12, color: '#636e72', fontWeight: '600', marginBottom: 6 },
  actualInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 10, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#dfe6f5' },
  actualInput: { flex: 1, fontSize: 16, fontWeight: '600', color: '#2d3436', paddingVertical: 10 },
  diffBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  sectionHead: { fontSize: 13, fontWeight: '700', color: '#2d3436', marginBottom: 12 },
});
