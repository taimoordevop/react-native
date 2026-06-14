import pandas as pd
import numpy as np
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, StandardScaler
from category_mapping import get_category_name, get_all_categories
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import string

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class TransactionDataPreprocessor:
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2
        )
        self.label_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        self.is_fitted = False
        
    def clean_text(self, text):
        """Clean transaction descriptions"""
        if pd.isna(text):
            return ""
        
        # Convert to lowercase
        text = str(text).lower()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def extract_features(self, df):
        """Extract features from transaction data"""
        # Clean descriptions
        df['clean_description'] = df['description'].apply(self.clean_text)
        df['clean_notes'] = df['notes'].apply(self.clean_text)
        
        # Combine description and notes
        df['combined_text'] = df['clean_description'] + ' ' + df['clean_notes']
        
        # Extract amount features
        df['amount_abs'] = abs(df['amount'])
        df['is_income'] = (df['amount'] > 0).astype(int)
        df['is_expense'] = (df['amount'] < 0).astype(int)
        
        # Extract date features
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.month
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        
        # Amount ranges
        df['amount_range'] = pd.cut(
            df['amount_abs'], 
            bins=[0, 500, 1000, 2000, 5000, float('inf')],
            labels=['0-500', '500-1000', '1000-2000', '2000-5000', '5000+']
        )
        
        return df
    
    def fit_transform(self, df):
        """Fit and transform the data"""
        # Extract features
        df = self.extract_features(df)
        
        # Prepare text features
        text_features = self.tfidf_vectorizer.fit_transform(df['combined_text'])
        
        # Prepare numerical features
        numerical_features = df[['amount_abs', 'is_income', 'is_expense', 'month', 'day_of_week', 'day_of_month']].values
        numerical_features = self.scaler.fit_transform(numerical_features)
        
        # Prepare categorical features
        amount_range_encoded = pd.get_dummies(df['amount_range'], prefix='amount_range')
        
        # Combine all features
        feature_matrix = np.hstack([
            text_features.toarray(),
            numerical_features,
            amount_range_encoded.values
        ])
        
        # Encode target labels
        df['category_name'] = df['category_id'].apply(get_category_name)
        labels = self.label_encoder.fit_transform(df['category_name'])
        
        self.is_fitted = True
        
        return feature_matrix, labels
    
    def transform(self, df):
        """Transform new data using fitted preprocessor"""
        if not self.is_fitted:
            raise ValueError("Preprocessor must be fitted before transform")
        
        # Extract features
        df = self.extract_features(df)
        
        # Prepare text features
        text_features = self.tfidf_vectorizer.transform(df['combined_text'])
        
        # Prepare numerical features
        numerical_features = df[['amount_abs', 'is_income', 'is_expense', 'month', 'day_of_week', 'day_of_month']].values
        numerical_features = self.scaler.transform(numerical_features)
        
        # Prepare categorical features
        amount_range_encoded = pd.get_dummies(df['amount_range'], prefix='amount_range')
        
        # Ensure all columns exist (add missing ones with zeros)
        expected_columns = [f'amount_range_{cat}' for cat in ['0-500', '500-1000', '1000-2000', '2000-5000', '5000+']]
        for col in expected_columns:
            if col not in amount_range_encoded.columns:
                amount_range_encoded[col] = 0
        
        # Combine all features
        feature_matrix = np.hstack([
            text_features.toarray(),
            numerical_features,
            amount_range_encoded[expected_columns].values
        ])
        
        return feature_matrix
    
    def get_feature_names(self):
        """Get feature names for interpretability"""
        text_features = self.tfidf_vectorizer.get_feature_names_out()
        numerical_features = ['amount_abs', 'is_income', 'is_expense', 'month', 'day_of_week', 'day_of_month']
        categorical_features = [f'amount_range_{cat}' for cat in ['0-500', '500-1000', '1000-2000', '2000-5000', '5000+']]
        
        return list(text_features) + numerical_features + categorical_features 