import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.pipeline import Pipeline
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from data_preprocessor import TransactionDataPreprocessor
from category_mapping import get_category_name, get_all_categories
import warnings
warnings.filterwarnings('ignore')

class TransactionClassifier:
    def __init__(self):
        self.preprocessor = TransactionDataPreprocessor()
        self.models = {}
        self.best_model = None
        self.best_model_name = None
        
    def load_data(self, csv_path):
        """Load and prepare transaction data"""
        print("Loading transaction data...")
        df = pd.read_csv(csv_path)
        
        # Remove rows with missing category_id
        df = df.dropna(subset=['category_id'])
        
        # Remove income transactions (they don't need categorization)
        df = df[df['amount'] < 0]
        
        print(f"Loaded {len(df)} expense transactions")
        print(f"Categories: {df['category_id'].nunique()}")
        
        return df
    
    def train_models(self, df):
        """Train multiple models and select the best one"""
        print("Preparing features...")
        X, y = self.preprocessor.fit_transform(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"Training set: {X_train.shape[0]} samples")
        print(f"Test set: {X_test.shape[0]} samples")
        
        # Define models
        models = {
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingClassifier(random_state=42),
            'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
            'SVM': SVC(random_state=42, probability=True)
        }
        
        # Train and evaluate models
        best_score = 0
        results = {}
        
        for name, model in models.items():
            print(f"\nTraining {name}...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Predict
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)
            
            # Evaluate
            accuracy = accuracy_score(y_test, y_pred)
            cv_scores = cross_val_score(model, X_train, y_train, cv=5)
            
            results[name] = {
                'model': model,
                'accuracy': accuracy,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'predictions': y_pred,
                'probabilities': y_pred_proba
            }
            
            print(f"Accuracy: {accuracy:.4f}")
            print(f"Cross-validation: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
            
            # Update best model
            if accuracy > best_score:
                best_score = accuracy
                self.best_model = model
                self.best_model_name = name
        
        self.models = results
        return results
    
    def evaluate_model(self, results, y_test):
        """Evaluate the best model in detail"""
        best_name = self.best_model_name
        best_results = results[best_name]
        
        print(f"\n=== Best Model: {best_name} ===")
        print(f"Accuracy: {best_results['accuracy']:.4f}")
        
        # Classification report
        print("\nClassification Report:")
        print(classification_report(y_test, best_results['predictions'], 
                                  target_names=self.preprocessor.label_encoder.classes_))
        
        # Confusion matrix
        cm = confusion_matrix(y_test, best_results['predictions'])
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=self.preprocessor.label_encoder.classes_,
                   yticklabels=self.preprocessor.label_encoder.classes_)
        plt.title(f'Confusion Matrix - {best_name}')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        return best_results
    
    def predict_category(self, description, amount, notes="", date=None):
        """Predict category for a new transaction"""
        if self.best_model is None:
            raise ValueError("Model not trained yet")
        
        # Create sample data
        sample_data = pd.DataFrame({
            'description': [description],
            'amount': [amount],
            'notes': [notes],
            'date': [date if date else pd.Timestamp.now().date()],
            'category_id': ['dummy']  # Will be ignored
        })
        
        # Transform features
        X = self.preprocessor.transform(sample_data)
        
        # Predict
        prediction = self.best_model.predict(X)[0]
        probability = self.best_model.predict_proba(X)[0]
        
        # Get category name
        category_name = self.preprocessor.label_encoder.inverse_transform([prediction])[0]
        confidence = probability[prediction]
        
        # Get top 3 predictions
        top_indices = probability.argsort()[-3:][::-1]
        top_predictions = []
        for idx in top_indices:
            cat_name = self.preprocessor.label_encoder.inverse_transform([idx])[0]
            top_predictions.append({
                'category': cat_name,
                'confidence': probability[idx]
            })
        
        return {
            'predicted_category': category_name,
            'confidence': confidence,
            'top_predictions': top_predictions
        }
    
    def save_model(self, filepath):
        """Save the trained model and preprocessor"""
        if self.best_model is None:
            raise ValueError("No model to save")
        
        model_data = {
            'model': self.best_model,
            'preprocessor': self.preprocessor,
            'model_name': self.best_model_name
        }
        
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load a trained model"""
        model_data = joblib.load(filepath)
        self.best_model = model_data['model']
        self.preprocessor = model_data['preprocessor']
        self.best_model_name = model_data['model_name']
        print(f"Model loaded from {filepath}")
    
    def feature_importance(self):
        """Show feature importance for Random Forest model"""
        if not isinstance(self.best_model, RandomForestClassifier):
            print("Feature importance only available for Random Forest model")
            return
        
        feature_names = self.preprocessor.get_feature_names()
        importances = self.best_model.feature_importances_
        
        # Create feature importance DataFrame
        feature_importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False)
        
        # Plot top 20 features
        plt.figure(figsize=(12, 8))
        top_features = feature_importance_df.head(20)
        sns.barplot(data=top_features, x='importance', y='feature')
        plt.title('Top 20 Feature Importances')
        plt.xlabel('Importance')
        plt.tight_layout()
        plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        return feature_importance_df 