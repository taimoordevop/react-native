# Category Mapping for Smart Budget Analyzer
# Based on analysis of transactions_rows (1).csv

CATEGORY_MAPPING = {
    "3eabb153-04b9-4edd-a6d9-5a7610215ffb": "Food",
    "a614a64f-f5b0-4bce-b6c9-0e3cf13326ab": "Transport", 
    "d4953743-374b-495b-9134-2f47a5e3ff69": "Education",
    "46c652d9-3622-4759-96b8-bc0b03e3f794": "Goals",
    "46cdd41c-2767-4c6c-a59c-ba1b04eb4571": "Extra",
    "e130010b-79ee-4cea-8a7d-ff79109bf7fb": "Income"
}

CATEGORY_NAMES = list(CATEGORY_MAPPING.values())
CATEGORY_IDS = list(CATEGORY_MAPPING.keys())

# Reverse mapping for easy lookup
CATEGORY_NAME_TO_ID = {v: k for k, v in CATEGORY_MAPPING.items()}

def get_category_name(category_id):
    """Get category name from UUID"""
    return CATEGORY_MAPPING.get(category_id, "Unknown")

def get_category_id(category_name):
    """Get category UUID from name"""
    return CATEGORY_NAME_TO_ID.get(category_name)

def get_all_categories():
    """Get all category names"""
    return CATEGORY_NAMES

def get_all_category_ids():
    """Get all category UUIDs"""
    return CATEGORY_IDS 