#!/usr/bin/env python3
"""
Test script to verify AI model setup
"""

import sys
import os

def test_imports():
    """Test if all required packages can be imported"""
    print("Testing imports...")
    
    try:
        import pandas as pd
        print("✓ pandas imported successfully")
    except ImportError as e:
        print(f"✗ pandas import failed: {e}")
        return False
    
    try:
        import numpy as np
        print("✓ numpy imported successfully")
    except ImportError as e:
        print(f"✗ numpy import failed: {e}")
        return False
    
    try:
        import sklearn
        print("✓ scikit-learn imported successfully")
    except ImportError as e:
        print(f"✗ scikit-learn import failed: {e}")
        return False
    
    try:
        import matplotlib.pyplot as plt
        print("✓ matplotlib imported successfully")
    except ImportError as e:
        print(f"✗ matplotlib import failed: {e}")
        return False
    
    try:
        import seaborn as sns
        print("✓ seaborn imported successfully")
    except ImportError as e:
        print(f"✗ seaborn import failed: {e}")
        return False
    
    return True

def test_data_file():
    """Test if the CSV file exists and can be read"""
    print("\nTesting data file...")
    
    csv_path = "transactions_rows (1).csv"
    if not os.path.exists(csv_path):
        print(f"✗ CSV file not found: {csv_path}")
        return False
    
    try:
        import pandas as pd
        df = pd.read_csv(csv_path)
        print(f"✓ CSV file loaded successfully")
        print(f"  - Rows: {len(df)}")
        print(f"  - Columns: {list(df.columns)}")
        return True
    except Exception as e:
        print(f"✗ CSV file read failed: {e}")
        return False

def test_local_modules():
    """Test if local modules can be imported"""
    print("\nTesting local modules...")
    
    try:
        from category_mapping import get_category_name, get_all_categories
        print("✓ category_mapping imported successfully")
    except ImportError as e:
        print(f"✗ category_mapping import failed: {e}")
        return False
    
    try:
        from data_preprocessor import TransactionDataPreprocessor
        print("✓ data_preprocessor imported successfully")
    except ImportError as e:
        print(f"✗ data_preprocessor import failed: {e}")
        return False
    
    try:
        from transaction_classifier import TransactionClassifier
        print("✓ transaction_classifier imported successfully")
    except ImportError as e:
        print(f"✗ transaction_classifier import failed: {e}")
        return False
    
    return True

def test_basic_functionality():
    """Test basic functionality"""
    print("\nTesting basic functionality...")
    
    try:
        from category_mapping import get_category_name, get_all_categories
        
        # Test category mapping
        test_id = "3eabb153-04b9-4edd-a6d9-5a7610215ffb"
        category_name = get_category_name(test_id)
        print(f"✓ Category mapping works: {test_id} → {category_name}")
        
        # Test category list
        categories = get_all_categories()
        print(f"✓ Categories: {categories}")
        
        return True
    except Exception as e:
        print(f"✗ Basic functionality test failed: {e}")
        return False

def main():
    print("=" * 50)
    print("Smart Budget Analyzer - Setup Test")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Test imports
    if not test_imports():
        all_tests_passed = False
    
    # Test data file
    if not test_data_file():
        all_tests_passed = False
    
    # Test local modules
    if not test_local_modules():
        all_tests_passed = False
    
    # Test basic functionality
    if not test_basic_functionality():
        all_tests_passed = False
    
    print("\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 All tests passed! You're ready to train the model.")
        print("\nNext steps:")
        print("1. Run: python train_model.py")
        print("2. Wait for training to complete")
        print("3. Check generated files and reports")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        print("\nCommon solutions:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Ensure CSV file is in the correct location")
        print("3. Check Python version (3.7+ required)")
    print("=" * 50)

if __name__ == "__main__":
    main() 