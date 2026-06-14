#!/usr/bin/env python3
"""
Smart Budget Analyzer - AI Model Training Script
Trains transaction categorization model using your 165 transaction rows
"""

import os
import sys
import pandas as pd
import numpy as np
from transaction_classifier import TransactionClassifier
from category_mapping import get_category_name, get_all_categories
import matplotlib.pyplot as plt
import seaborn as sns

def main():
    print("=" * 60)
    print("Smart Budget Analyzer - AI Model Training")
    print("=" * 60)
    
    # Initialize classifier
    classifier = TransactionClassifier()
    
    # Load data
    csv_path = "transactions_rows (1).csv"
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found!")
        print("Please ensure the CSV file is in the same directory as this script.")
        return
    
    df = classifier.load_data(csv_path)
    
    # Display data overview
    print("\n" + "=" * 40)
    print("DATA OVERVIEW")
    print("=" * 40)
    
    # Category distribution
    df['category_name'] = df['category_id'].apply(get_category_name)
    category_counts = df['category_name'].value_counts()
    
    print("\nCategory Distribution:")
    for category, count in category_counts.items():
        percentage = (count / len(df)) * 100
        print(f"  {category}: {count} transactions ({percentage:.1f}%)")
    
    # Amount statistics
    print(f"\nAmount Statistics:")
    print(f"  Total transactions: {len(df)}")
    print(f"  Average amount: {abs(df['amount']).mean():.2f} PKR")
    print(f"  Median amount: {abs(df['amount']).median():.2f} PKR")
    print(f"  Min amount: {abs(df['amount']).min():.2f} PKR")
    print(f"  Max amount: {abs(df['amount']).max():.2f} PKR")
    
    # Date range
    df['date'] = pd.to_datetime(df['date'])
    print(f"\nDate Range:")
    print(f"  From: {df['date'].min().strftime('%Y-%m-%d')}")
    print(f"  To: {df['date'].max().strftime('%Y-%m-%d')}")
    
    # Visualize data distribution
    visualize_data(df)
    
    # Train models
    print("\n" + "=" * 40)
    print("TRAINING MODELS")
    print("=" * 40)
    
    results = classifier.train_models(df)
    
    # Evaluate best model
    print("\n" + "=" * 40)
    print("MODEL EVALUATION")
    print("=" * 40)
    
    # Get test data for evaluation
    X, y = classifier.preprocessor.fit_transform(df)
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    best_results = classifier.evaluate_model(results, y_test)
    
    # Show feature importance if Random Forest
    if classifier.best_model_name == 'Random Forest':
        print("\n" + "=" * 40)
        print("FEATURE IMPORTANCE")
        print("=" * 40)
        feature_importance_df = classifier.feature_importance()
        print("\nTop 10 Most Important Features:")
        print(feature_importance_df.head(10))
    
    # Save model
    print("\n" + "=" * 40)
    print("SAVING MODEL")
    print("=" * 40)
    
    model_path = "transaction_classifier_model.pkl"
    classifier.save_model(model_path)
    
    # Test predictions
    print("\n" + "=" * 40)
    print("TESTING PREDICTIONS")
    print("=" * 40)
    
    test_cases = [
        {"description": "Grocery shopping", "amount": -2000, "notes": "Monthly essentials"},
        {"description": "Taxi Ride", "amount": -500, "notes": "Work commute"},
        {"description": "AI subscription", "amount": -600, "notes": "Monthly payment"},
        {"description": "Goal: New bike", "amount": -1000, "notes": "Savings contribution"},
        {"description": "PUBG RP", "amount": -1500, "notes": "Gaming purchase"}
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        prediction = classifier.predict_category(
            test_case["description"], 
            test_case["amount"], 
            test_case["notes"]
        )
        
        print(f"\nTest Case {i}:")
        print(f"  Description: {test_case['description']}")
        print(f"  Amount: {test_case['amount']} PKR")
        print(f"  Notes: {test_case['notes']}")
        print(f"  Predicted: {prediction['predicted_category']}")
        print(f"  Confidence: {prediction['confidence']:.2%}")
        print(f"  Top 3 predictions:")
        for pred in prediction['top_predictions']:
            print(f"    - {pred['category']}: {pred['confidence']:.2%}")
    
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    print(f"Best model: {classifier.best_model_name}")
    print(f"Accuracy: {best_results['accuracy']:.2%}")
    print(f"Model saved to: {model_path}")
    print("\nYou can now use this model in your React Native app!")

def visualize_data(df):
    """Create visualizations of the data"""
    plt.style.use('seaborn-v0_8')
    
    # Create subplots
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Transaction Data Analysis', fontsize=16, fontweight='bold')
    
    # 1. Category distribution
    category_counts = df['category_name'].value_counts()
    axes[0, 0].pie(category_counts.values, labels=category_counts.index, autopct='%1.1f%%')
    axes[0, 0].set_title('Category Distribution')
    
    # 2. Amount distribution by category
    df['amount_abs'] = abs(df['amount'])  # Add this line to create the column
    df.boxplot(column='amount_abs', by='category_name', ax=axes[0, 1])
    axes[0, 1].set_title('Amount Distribution by Category')
    axes[0, 1].set_xlabel('Category')
    axes[0, 1].set_ylabel('Amount (PKR)')
    
    # 3. Monthly spending trends
    monthly_spending = df.groupby(df['date'].dt.to_period('M'))['amount_abs'].sum()
    monthly_spending.plot(kind='bar', ax=axes[1, 0])
    axes[1, 0].set_title('Monthly Spending Trends')
    axes[1, 0].set_xlabel('Month')
    axes[1, 0].set_ylabel('Total Spending (PKR)')
    axes[1, 0].tick_params(axis='x', rotation=45)
    
    # 4. Day of week spending
    day_spending = df.groupby(df['date'].dt.day_name())['amount_abs'].mean()
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    day_spending = day_spending.reindex(day_order)
    day_spending.plot(kind='bar', ax=axes[1, 1])
    axes[1, 1].set_title('Average Spending by Day of Week')
    axes[1, 1].set_xlabel('Day of Week')
    axes[1, 1].set_ylabel('Average Amount (PKR)')
    axes[1, 1].tick_params(axis='x', rotation=45)
    
    plt.tight_layout()
    plt.savefig('data_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()

if __name__ == "__main__":
    main() 