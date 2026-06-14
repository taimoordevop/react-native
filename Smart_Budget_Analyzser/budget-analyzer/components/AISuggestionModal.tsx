import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AISuggestionModalProps {
  visible: boolean;
  prediction: any;
  onAccept: (category: string) => void;
  onReject: () => void;
}

const AISuggestionModal: React.FC<AISuggestionModalProps> = ({
  visible,
  prediction,
  onAccept,
  onReject
}) => {
  if (!prediction) return null;

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

  const confidenceColor = getConfidenceColor(prediction.confidence);
  const confidenceText = getConfidenceText(prediction.confidence);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#f8f9fa', '#e9ecef']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.aiIconContainer}>
                <Ionicons name="brain" size={24} color="#007AFF" />
              </View>
              <Text style={styles.title}>AI Category Suggestion</Text>
            </View>

            {/* Suggestion Content */}
            <View style={styles.content}>
              <Text style={styles.suggestionText}>
                I suggest you select{' '}
                <Text style={styles.categoryHighlight}>
                  {prediction.predicted_category}
                </Text>{' '}
                for this transaction.
              </Text>

              <View style={styles.confidenceContainer}>
                <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
                <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                  {confidenceText} Confidence ({Math.round(prediction.confidence * 100)}%)
                </Text>
              </View>

              {/* Top Predictions */}
              {prediction.top_predictions && prediction.top_predictions.length > 0 && (
                <View style={styles.predictionsContainer}>
                  <Text style={styles.predictionsTitle}>Top Predictions:</Text>
                  {prediction.top_predictions.slice(0, 3).map((pred: any, index: number) => (
                    <View key={index} style={styles.predictionItem}>
                      <Text style={styles.predictionCategory}>{pred.category}</Text>
                      <Text style={styles.predictionPercentage}>
                        {Math.round(pred.confidence * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={onReject}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => onAccept(prediction.predicted_category)}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientContainer: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  content: {
    marginBottom: 24,
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  categoryHighlight: {
    fontWeight: '700',
    color: '#007AFF',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  confidenceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  predictionsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  predictionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  predictionCategory: {
    fontSize: 14,
    color: '#333',
  },
  predictionPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
  },
  rejectButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#007AFF',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});

export default AISuggestionModal; 