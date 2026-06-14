import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CurrencyConverter from '../calculators/currency-converter';
import LoanCalculator from '../calculators/loan-calculator';
import InvestmentCalculator from '../calculators/investment-calculator';
import BudgetPlanner from '../calculators/budget-planner';
import TaxCalculator from '../calculators/tax-calculator';
import SavingsGoal from '../calculators/savings-goal';

interface CalculatorTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconLib: 'ionicons' | 'material';
  gradient: [string, string];
  available: boolean;
  tag?: string;
}

const TOOLS: CalculatorTool[] = [
  {
    id: 'currency',
    title: 'Currency Converter',
    description: 'Convert PKR ↔ USD and 8 more currencies with live rates',
    icon: 'swap-horizontal',
    iconLib: 'ionicons',
    gradient: ['#4f8cff', '#6a82fb'],
    available: true,
    tag: 'Live Rates',
  },
  {
    id: 'loan',
    title: 'Loan / EMI Calculator',
    description: 'Monthly EMI, total interest & amortization schedule',
    icon: 'calculator',
    iconLib: 'ionicons',
    gradient: ['#00b894', '#00cec9'],
    available: true,
    tag: 'Formula Based',
  },
  {
    id: 'investment',
    title: 'Investment Calculator',
    description: 'Lump sum & SIP compound interest growth projections',
    icon: 'trending-up',
    iconLib: 'ionicons',
    gradient: ['#a29bfe', '#6c5ce7'],
    available: true,
    tag: 'Formula Based',
  },
  {
    id: 'budget',
    title: 'Budget Planner',
    description: '50/30/20 rule budgeting with category breakdown',
    icon: 'pie-chart',
    iconLib: 'ionicons',
    gradient: ['#fdcb6e', '#e17055'],
    available: true,
    tag: 'Formula Based',
  },
  {
    id: 'tax',
    title: 'Tax Calculator',
    description: 'Pakistan FBR income tax — FY 2025-26 (Finance Act 2025)',
    icon: 'document-text',
    iconLib: 'ionicons',
    gradient: ['#fd79a8', '#e84393'],
    available: true,
    tag: 'FBR 2025-26',
  },
  {
    id: 'savings',
    title: 'Savings Goal',
    description: 'Plan your path to financial goals with milestones',
    icon: 'wallet',
    iconLib: 'ionicons',
    gradient: ['#55efc4', '#00b894'],
    available: true,
    tag: 'Formula Based',
  },
];

export default function ToolsScreen() {
  const [openTool, setOpenTool] = useState<string | null>(null);

  const renderToolScreen = () => {
    switch (openTool) {
      case 'currency': return <CurrencyConverter />;
      case 'loan': return <LoanCalculator />;
      case 'investment': return <InvestmentCalculator />;
      case 'budget': return <BudgetPlanner />;
      case 'tax': return <TaxCalculator />;
      case 'savings': return <SavingsGoal />;
      default: return null;
    }
  };

  const openToolTitle = TOOLS.find(t => t.id === openTool)?.title ?? '';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header Banner */}
        <LinearGradient
          colors={['#4f8cff', '#6a82fb', '#a18cd1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <MaterialCommunityIcons name="tools" size={36} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroTitle}>Financial Tools</Text>
          <Text style={styles.heroSubtitle}>Smart calculators to manage your finances</Text>
        </LinearGradient>

        {/* Available Tools */}
        <Text style={styles.sectionLabel}>Available</Text>
        {TOOLS.filter(t => t.available).map(tool => (
          <TouchableOpacity
            key={tool.id}
            style={styles.toolCard}
            onPress={() => setOpenTool(tool.id)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={tool.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toolIcon}
            >
              <Ionicons name={tool.icon as any} size={26} color="#fff" />
            </LinearGradient>
            <View style={styles.toolInfo}>
              <View style={styles.toolTitleRow}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                {tool.tag && (
                  <View style={styles.liveTag}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveTagText}>{tool.tag}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.toolDescription}>{tool.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b2bec3" />
          </TouchableOpacity>
        ))}

        {TOOLS.filter(t => !t.available).length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Coming Soon</Text>
            <View style={styles.comingSoonGrid}>
              {TOOLS.filter(t => !t.available).map(tool => (
                <View key={tool.id} style={styles.comingSoonCard}>
                  <LinearGradient
                    colors={tool.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.toolIcon, styles.comingSoonIcon]}
                  >
                    <Ionicons name={tool.icon as any} size={22} color="rgba(255,255,255,0.7)" />
                  </LinearGradient>
                  <Text style={styles.comingSoonTitle}>{tool.title}</Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Soon</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Full-screen Tool Modal */}
      <Modal
        visible={openTool !== null}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <LinearGradient
            colors={['#4f8cff', '#6a82fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity onPress={() => setOpenTool(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{openToolTitle}</Text>
            <View style={styles.backButton} />
          </LinearGradient>

          {/* Tool Content */}
          <View style={styles.modalContent}>
            {renderToolScreen()}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16 },
  heroBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 6,
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#636e72',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  toolIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  toolInfo: { flex: 1 },
  toolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  toolTitle: { fontSize: 16, fontWeight: '700', color: '#2d3436' },
  toolDescription: { fontSize: 12, color: '#636e72', lineHeight: 18 },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    flexShrink: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00b894',
    marginRight: 4,
  },
  liveTagText: { fontSize: 10, color: '#00b894', fontWeight: '700', flexShrink: 1 },
  comingSoonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  comingSoonCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    opacity: 0.75,
  },
  comingSoonIcon: { opacity: 0.7, marginRight: 0, marginBottom: 10 },
  comingSoonTitle: { fontSize: 13, fontWeight: '700', color: '#2d3436', marginBottom: 8 },
  comingSoonBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  comingSoonBadgeText: { fontSize: 10, color: '#636e72', fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 14,
    elevation: 4,
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalContent: { flex: 1 },
});
