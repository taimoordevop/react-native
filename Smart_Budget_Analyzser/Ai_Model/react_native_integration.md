# React Native Integration Guide

This guide shows how to integrate the trained AI model with your Smart Budget Analyzer React Native app.

## 🎯 Integration Options

### Option 1: TensorFlow.js (Recommended)

#### 1. Install Dependencies

```bash
cd SecretsApp
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
npm install @react-native-async-storage/async-storage
```

#### 2. Convert Python Model to TensorFlow.js

After training, convert the model:

```python
# Add to train_model.py or create convert_model.py
import tensorflow as tf
from tensorflow import keras
import joblib

# Load the trained model
model_data = joblib.load('transaction_classifier_model.pkl')
model = model_data['model']

# Convert to TensorFlow.js format
tf.saved_model.save(model, 'tfjs_model')
```

#### 3. Add Model Files to React Native

```bash
# Copy model files to your app
cp -r tfjs_model SecretsApp/assets/
```

#### 4. Create AI Service in React Native

```javascript
// SecretsApp/services/AIService.js
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

class AIService {
  constructor() {
    this.model = null;
    this.preprocessor = null;
  }

  async loadModel() {
    try {
      await tf.ready();
      this.model = await tf.loadLayersModel('file://assets/tfjs_model/model.json');
      console.log('AI model loaded successfully');
    } catch (error) {
      console.error('Failed to load AI model:', error);
    }
  }

  async predictCategory(description, amount, notes = '') {
    if (!this.model) {
      console.warn('Model not loaded');
      return null;
    }

    try {
      // Preprocess input (simplified version)
      const features = this.preprocessInput(description, amount, notes);
      
      // Make prediction
      const prediction = await this.model.predict(features);
      const categoryIndex = prediction.argMax(-1).dataSync()[0];
      
      // Map to category name
      const categories = ['Food', 'Transport', 'Education', 'Goals', 'Extra'];
      const predictedCategory = categories[categoryIndex];
      
      return {
        category: predictedCategory,
        confidence: prediction.max().dataSync()[0]
      };
    } catch (error) {
      console.error('Prediction failed:', error);
      return null;
    }
  }

  preprocessInput(description, amount, notes) {
    // Simplified preprocessing - you'll need to implement the full pipeline
    const text = `${description} ${notes}`.toLowerCase();
    // Add your preprocessing logic here
    return tf.tensor2d([[/* processed features */]]);
  }
}

export default new AIService();
```

#### 5. Integrate with Add Transaction Screen

```javascript
// SecretsApp/app/add_transaction.tsx
import AIService from '../services/AIService';

// Add to your component
const [aiPrediction, setAiPrediction] = useState(null);

// Add AI prediction when description changes
const handleDescriptionChange = async (text) => {
  setDescription(text);
  
  if (text.length > 3) {
    const prediction = await AIService.predictCategory(text, amount, notes);
    if (prediction && prediction.confidence > 0.7) {
      setAiPrediction(prediction);
      // Auto-select the predicted category
      setSelectedCategory(prediction.category);
    }
  }
};

// Add AI suggestion UI
{aiPrediction && (
  <View style={styles.aiSuggestion}>
    <Text style={styles.aiText}>
      AI Suggestion: {aiPrediction.category} 
      ({Math.round(aiPrediction.confidence * 100)}% confidence)
    </Text>
  </View>
)}
```

### Option 2: Rule-Based Fallback (Offline)

#### 1. Create Simple Keyword Matcher

```javascript
// SecretsApp/services/KeywordMatcher.js
class KeywordMatcher {
  constructor() {
    this.rules = {
      'Food': [
        'grocery', 'food', 'restaurant', 'cafe', 'coffee', 'lunch', 'dinner',
        'breakfast', 'snack', 'pizza', 'burger', 'ice cream', 'fruit'
      ],
      'Transport': [
        'taxi', 'uber', 'bus', 'train', 'fuel', 'gas', 'car', 'bike',
        'transport', 'ride', 'fare', 'ticket', 'service', 'repair'
      ],
      'Education': [
        'course', 'subscription', 'ai', 'learning', 'study', 'workshop',
        'training', 'skill', 'education', 'webinar', 'notes', 'material'
      ],
      'Goals': [
        'goal', 'savings', 'emergency', 'fund', 'contribution', 'bike',
        'car', 'vacation', 'down payment'
      ],
      'Extra': [
        'game', 'entertainment', 'bill', 'electricity', 'gas', 'netflix',
        'concert', 'outing', 'fun', 'pubg', 'rp', 'uc'
      ]
    };
  }

  predictCategory(description, amount) {
    const text = description.toLowerCase();
    let bestMatch = { category: 'Extra', score: 0 };

    for (const [category, keywords] of Object.entries(this.rules)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }

    return {
      category: bestMatch.category,
      confidence: bestMatch.score > 0 ? 0.8 : 0.3
    };
  }
}

export default new KeywordMatcher();
```

#### 2. Use in Add Transaction Screen

```javascript
// In add_transaction.tsx
import KeywordMatcher from '../services/KeywordMatcher';

const handleDescriptionChange = (text) => {
  setDescription(text);
  
  if (text.length > 3) {
    const prediction = KeywordMatcher.predictCategory(text, amount);
    setAiPrediction(prediction);
  }
};
```

### Option 3: API Endpoint (Online)

#### 1. Create Simple API Server

```python
# api_server.py
from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# Load trained model
model_data = joblib.load('transaction_classifier_model.pkl')
classifier = model_data['model']
preprocessor = model_data['preprocessor']

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    description = data.get('description', '')
    amount = data.get('amount', 0)
    notes = data.get('notes', '')
    
    # Create sample data
    sample_data = pd.DataFrame({
        'description': [description],
        'amount': [amount],
        'notes': [notes],
        'date': [pd.Timestamp.now().date()],
        'category_id': ['dummy']
    })
    
    # Transform and predict
    X = preprocessor.transform(sample_data)
    prediction = classifier.predict(X)[0]
    probability = classifier.predict_proba(X)[0]
    
    category_name = preprocessor.label_encoder.inverse_transform([prediction])[0]
    confidence = probability[prediction]
    
    return jsonify({
        'category': category_name,
        'confidence': float(confidence)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

#### 2. Call API from React Native

```javascript
// SecretsApp/services/APIService.js
class APIService {
  async predictCategory(description, amount, notes = '') {
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          amount,
          notes
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      return null;
    }
  }
}

export default new APIService();
```

## 🎨 UI Enhancements

### Add AI Suggestion Component

```javascript
// SecretsApp/components/AISuggestion.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AISuggestion = ({ prediction, onAccept, onReject }) => {
  if (!prediction) return null;

  return (
    <View style={styles.container}>
      <View style={styles.suggestionBox}>
        <Ionicons name="bulb" size={20} color="#007AFF" />
        <Text style={styles.text}>
          AI suggests: <Text style={styles.category}>{prediction.category}</Text>
        </Text>
        <Text style={styles.confidence}>
          {Math.round(prediction.confidence * 100)}% confident
        </Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  text: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  category: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  confidence: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  acceptText: {
    color: 'white',
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  rejectText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AISuggestion;
```

## 🚀 Implementation Steps

1. **Choose Integration Method**: Start with Option 2 (Keyword Matcher) for quick testing
2. **Test Basic Functionality**: Ensure predictions work in development
3. **Add UI Components**: Integrate AI suggestions into your add transaction screen
4. **Optimize Performance**: Move to TensorFlow.js for better accuracy
5. **Monitor Usage**: Track prediction accuracy and user feedback

## 📊 Expected Results

With your 165 transaction dataset, you should achieve:
- **Accuracy**: 85-95% for transaction categorization
- **User Experience**: Faster transaction entry with AI suggestions
- **Data Quality**: More consistent category assignments

## 🔄 Continuous Improvement

1. **Collect Feedback**: Track when users accept/reject AI suggestions
2. **Retrain Model**: Periodically retrain with new transaction data
3. **A/B Testing**: Compare AI vs manual categorization performance
4. **User Education**: Explain AI features to improve adoption

---

**Ready to implement! Start with the keyword matcher for quick results, then upgrade to TensorFlow.js for better accuracy.** 