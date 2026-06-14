import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import aiService from './services/AIService';
import { CurrencyContext } from './_layout';

export default function AISuggestionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currency, getCurrencySymbol } = useContext(CurrencyContext);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { description, amount, notes, transactionType } = params;

  useEffect(() => {
    if (description && amount) {
      analyzeTransaction();
    }
  }, [description, amount, notes]);

  const analyzeTransaction = () => {
    setLoading(true);
    
    // Simulate AI processing time for better UX
    setTimeout(() => {
      const amountValue = parseFloat(amount as string);
      const prediction = aiService.predictCategory(
        description as string, 
        amountValue, 
        notes as string
      );
      
      setPredictions(prediction);
      setLoading(false);
    }, 1500);
  };

  const handleAccept = (category: string) => {
    // Navigate back with the selected category as a parameter
    router.back();
    // Store the selected category in global variable for the parent screen
    (global as any).selectedAICategory = category;
    // Also store a timestamp to ensure it's fresh
    (global as any).selectedAICategoryTimestamp = Date.now();
  };

  const handleReject = () => {
    router.back();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50'; // Green
    if (confidence >= 0.6) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradientContainer}
        >
          <View style={styles.loadingContainer}>
            <View style={styles.aiIconContainer}>
              <Ionicons name="brain" size={48} color="white" />
            </View>
            <Text style={styles.loadingTitle}>AI Analyzing...</Text>
            <Text style={styles.loadingSubtitle}>
              Analyzing your transaction for smart category suggestions
            </Text>
            <ActivityIndicator size="large" color="white" style={styles.spinner} />
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!predictions) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradientContainer}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="white" />
            <Text style={styles.errorTitle}>Unable to Analyze</Text>
            <Text style={styles.errorSubtitle}>
              Please try again with a different description
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={analyzeTransaction}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleReject}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>AI Category Suggestion</Text>
            <Text style={styles.headerSubtitle}>Smart analysis for your transaction</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Transaction Info */}
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionLabel}>Transaction Details:</Text>
            <View style={styles.transactionCard}>
              <Text style={styles.transactionDescription}>{description}</Text>
              <Text style={styles.transactionAmount}>{getCurrencySymbol(currency)}{amount}</Text>
              {notes && <Text style={styles.transactionNotes}>Notes: {notes}</Text>}
            </View>
          </View>

          {/* Top Prediction */}
          <View style={styles.topPredictionContainer}>
            <View style={styles.topPredictionHeader}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.topPredictionTitle}>Recommended Category</Text>
            </View>
            
            <TouchableOpacity
              style={styles.topPredictionCard}
              onPress={() => handleAccept(predictions.predicted_category)}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.topPredictionGradient}
              >
                <View style={styles.topPredictionContent}>
                  <Text style={styles.topPredictionCategory}>
                    {predictions.predicted_category}
                  </Text>
                  <Text style={styles.topPredictionConfidence}>
                    {Math.round(predictions.confidence * 100)}% Confidence
                  </Text>
                  <View style={styles.acceptButton}>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.acceptButtonText}>Accept This Category</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Other Predictions */}
          {predictions.top_predictions && predictions.top_predictions.length > 1 && (
            <View style={styles.otherPredictionsContainer}>
              <Text style={styles.otherPredictionsTitle}>Other Suggestions</Text>
              
              {predictions.top_predictions.slice(1, 4).map((pred: any, index: number) => {
                const confidenceColor = getConfidenceColor(pred.confidence);
                const confidenceText = getConfidenceText(pred.confidence);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.otherPredictionCard}
                    onPress={() => handleAccept(pred.category)}
                  >
                    <View style={styles.otherPredictionContent}>
                      <View style={styles.otherPredictionLeft}>
                        <Text style={styles.otherPredictionCategory}>{pred.category}</Text>
                        <View style={styles.confidenceContainer}>
                          <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
                          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                            {confidenceText} Confidence ({Math.round(pred.confidence * 100)}%)
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => handleAccept(pred.category)}
                      >
                        <Ionicons name="checkmark" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Reject Option */}
          <View style={styles.rejectContainer}>
            <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
              <Ionicons name="close-circle" size={20} color="#666" />
              <Text style={styles.rejectButtonText}>Choose Category Manually</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 10,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  spinner: {
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  errorSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionInfo: {
    marginBottom: 30,
  },
  transactionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  transactionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  transactionDescription: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  transactionNotes: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  topPredictionContainer: {
    marginBottom: 30,
  },
  topPredictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  topPredictionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 10,
  },
  topPredictionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  topPredictionGradient: {
    padding: 20,
  },
  topPredictionContent: {
    alignItems: 'center',
  },
  topPredictionCategory: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  topPredictionConfidence: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  otherPredictionsContainer: {
    marginBottom: 30,
  },
  otherPredictionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  otherPredictionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  otherPredictionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  otherPredictionLeft: {
    flex: 1,
  },
  otherPredictionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectContainer: {
    marginBottom: 30,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 