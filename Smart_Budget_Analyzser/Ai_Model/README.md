# Smart Budget Analyzer - AI Model Training

This directory contains the AI model training pipeline for the Smart Budget Analyzer app. The system trains machine learning models to automatically categorize financial transactions based on your transaction history.

## 🎯 Features

- **Transaction Categorization**: Automatically categorize new transactions using ML
- **Multiple Algorithms**: Tests Random Forest, Gradient Boosting, Logistic Regression, and SVM
- **Feature Engineering**: Extracts text, numerical, and temporal features
- **Model Evaluation**: Comprehensive evaluation with confusion matrix and feature importance
- **Easy Integration**: Export trained models for use in React Native app

## 📊 Dataset

The training uses your `transactions_rows (1).csv` file containing 165 transaction rows with:
- Transaction descriptions and notes
- Amounts and dates
- Category IDs (mapped to: Food, Transport, Education, Goals, Extra, Income)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python packages
pip install -r requirements.txt
```

### 2. Train the Model

```bash
# Run the training script
python train_model.py
```

### 3. Expected Output

The script will:
- Load and analyze your transaction data
- Train multiple ML models
- Select the best performing model
- Generate visualizations and reports
- Save the trained model as `transaction_classifier_model.pkl`

## 📁 File Structure

```
Ai_Model/
├── requirements.txt              # Python dependencies
├── category_mapping.py           # Category UUID to name mapping
├── data_preprocessor.py          # Data cleaning and feature extraction
├── transaction_classifier.py     # Main ML model training
├── train_model.py               # Training script
├── README.md                    # This file
├── transactions_rows (1).csv    # Your transaction data
└── transaction_classifier_model.pkl  # Trained model (generated)
```

## 🔧 Model Details

### Features Used
- **Text Features**: TF-IDF vectors from transaction descriptions and notes
- **Numerical Features**: Amount, income/expense flags, date components
- **Categorical Features**: Amount ranges (0-500, 500-1000, etc.)

### Algorithms Tested
1. **Random Forest**: Best for interpretability and feature importance
2. **Gradient Boosting**: Often highest accuracy
3. **Logistic Regression**: Fast and interpretable
4. **Support Vector Machine**: Good for complex patterns

### Expected Performance
- **Accuracy**: 85-95% (depending on data quality)
- **Categories**: Food, Transport, Education, Goals, Extra
- **Income transactions**: Automatically excluded (no categorization needed)

## 📈 Generated Reports

After training, you'll get:
- `data_analysis.png`: Transaction data visualizations
- `confusion_matrix.png`: Model performance matrix
- `feature_importance.png`: Most important features (Random Forest only)

## 🧪 Testing Predictions

The training script includes test cases:
```python
# Example predictions
"Grocery shopping" → Food (high confidence)
"Taxi Ride" → Transport (high confidence)
"AI subscription" → Education (high confidence)
"Goal: New bike" → Goals (high confidence)
"PUBG RP" → Extra (high confidence)
```

## 🔄 Integration with React Native

### Option 1: TensorFlow.js (Recommended)
1. Convert Python model to TensorFlow.js format
2. Use in React Native with `@tensorflow/tfjs-react-native`
3. Real-time predictions in the app

### Option 2: API Endpoint
1. Deploy model as REST API
2. Call from React Native app
3. Requires internet connection

### Option 3: Rule-Based Fallback
1. Use simple keyword matching
2. Implement in JavaScript
3. Works offline, less accurate

## 🛠️ Customization

### Adding New Categories
1. Update `category_mapping.py`
2. Retrain the model
3. Update app category list

### Feature Engineering
Modify `data_preprocessor.py` to add:
- Merchant name extraction
- Time-based patterns
- Seasonal spending trends

### Model Tuning
Edit `transaction_classifier.py` to:
- Adjust hyperparameters
- Add new algorithms
- Change evaluation metrics

## 📊 Data Requirements

For best results, ensure your CSV has:
- At least 50 transactions per category
- Varied transaction descriptions
- Consistent category assignments
- Clean, readable descriptions

## 🐛 Troubleshooting

### Common Issues

**"CSV file not found"**
- Ensure `transactions_rows (1).csv` is in the same directory

**"Module not found"**
- Run `pip install -r requirements.txt`

**"Low accuracy"**
- Check category distribution (should be balanced)
- Review transaction descriptions for consistency
- Add more training data

**"Memory error"**
- Reduce `max_features` in `TfidfVectorizer`
- Use smaller dataset for testing

## 📞 Support

For issues or questions:
1. Check the error messages
2. Review the data quality
3. Ensure all dependencies are installed
4. Verify CSV format matches expected structure

## 🎉 Next Steps

After successful training:
1. Test the model with new transactions
2. Integrate with your React Native app
3. Monitor prediction accuracy
4. Retrain periodically with new data

---

**Happy Training! 🚀** 