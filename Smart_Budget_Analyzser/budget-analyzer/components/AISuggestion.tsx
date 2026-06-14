import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import aiService from '../app/services/AIService';

interface AISuggestionProps {
  description: string;
  amount: number;
  notes?: string;
  onCategorySelect: (category: string) => void;
  selectedCategory?: string | null;
  showInsights?: boolean;
}

interface Prediction {
  predicted_category: string;
  confidence: number;
  top_predictions: Array<{
    category: string;
    confidence: number;
  }>;
  scores: Record<string, number>;
}

const AISuggestion: React.FC<AISuggestionProps> = ({ 
  description, 
  amount, 
  notes = '', 
  onCategorySelect, 
  selectedCategory = null,
  showInsights = false 
}) => {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (description && amount) {
      generatePrediction();
    }
  }, [description, amount, notes]);

  const generatePrediction = async () => {
    setLoading(true);
    try {
      const result = aiService.predictCategory(description, amount, notes);
      setPrediction(result);
    } catch (error) {
      console.error('AI prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    onCategorySelect(category);
    Alert.alert(
      'AI Suggestion Applied',
      `Category set to "${category}" based on AI analysis.`,
      [{ text: 'OK' }]
    );
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

  if (!prediction || loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="brain" size={20} color="#666" />
          <Text style={styles.loadingText}>AI analyzing...</Text>
        </View>
      </View>
    );
  }

  const isConfident = aiService.isConfidentPrediction(prediction);
  const confidenceColor = getConfidenceColor(prediction.confidence);
  const confidenceText = getConfidenceText(prediction.confidence);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8f9fa', '#e9ecef']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="brain" size={16} color="#007AFF" />
          </View>
          <Text style={styles.title}>AI Category Suggestion</Text>
          <TouchableOpacity 
            onPress={() => setShowDetails(!showDetails)}
            style={styles.toggleButton}
          >
            <Ionicons 
              name={showDetails ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        {/* Main Prediction */}
        <View style={styles.mainPrediction}>
          <View style={styles.predictionRow}>
            <Text style={styles.predictedCategory}>
              {prediction.predicted_category}
            </Text>
            <View style={styles.confidenceContainer}>
              <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {confidenceText} ({Math.round(prediction.confidence * 100)}%)
              </Text>
            </View>
          </View>

          {isConfident && (
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => handleCategorySelect(prediction.predicted_category)}
            >
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text style={styles.applyButtonText}>Apply Suggestion</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Detailed Predictions */}
        {showDetails && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Top Predictions:</Text>
            {prediction.top_predictions.map((pred, index) => (
              <View key={index} style={styles.predictionItem}>
                <View style={styles.predictionInfo}>
                  <Text style={styles.categoryName}>{pred.category}</Text>
                  <Text style={styles.predictionPercentage}>
                    {Math.round(pred.confidence * 100)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${pred.confidence * 100}%`,
                        backgroundColor: getConfidenceColor(pred.confidence)
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Insights */}
        {showInsights && prediction.scores && (
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>AI Analysis:</Text>
            <Text style={styles.insightText}>
              Based on your transaction description and amount, 
              the AI suggests this is most likely a {prediction.predicted_category.toLowerCase()} expense.
            </Text>
            {prediction.confidence < 0.6 && (
              <Text style={styles.lowConfidenceText}>
                ⚠️ Low confidence prediction. Please review the category manually.
              </Text>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientContainer: {
    padding: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  toggleButton: {
    padding: 4,
  },
  mainPrediction: {
    marginBottom: 12,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  predictedCategory: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
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
    fontWeight: '600',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  predictionItem: {
    marginBottom: 8,
  },
  predictionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
  },
  predictionPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  lowConfidenceText: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
  },
});

export default AISuggestion; 