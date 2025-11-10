"""
Test if all dependencies are installed correctly
"""

def test_imports():
    """Test all required imports"""
    print("🧪 Testing imports...\n")
    
    try:
        import pandas as pd
        print("✅ pandas:", pd.__version__)
    except ImportError as e:
        print("❌ pandas not installed:", e)
    
    try:
        import numpy as np
        print("✅ numpy:", np.__version__)
    except ImportError as e:
        print("❌ numpy not installed:", e)
    
    try:
        import sklearn
        print("✅ scikit-learn:", sklearn.__version__)
    except ImportError as e:
        print("❌ scikit-learn not installed:", e)
    
    try:
        import nltk
        print("✅ nltk:", nltk.__version__)
    except ImportError as e:
        print("❌ nltk not installed:", e)
    
    try:
        import matplotlib
        print("✅ matplotlib:", matplotlib.__version__)
    except ImportError as e:
        print("❌ matplotlib not installed:", e)
    
    try:
        import seaborn
        print("✅ seaborn:", seaborn.__version__)
    except ImportError as e:
        print("❌ seaborn not installed:", e)
    
    print("\n🧪 Testing NLTK data...\n")
    
    try:
        from nltk.corpus import stopwords
        stop_words = stopwords.words('english')
        print(f"✅ stopwords: {len(stop_words)} words loaded")
    except Exception as e:
        print("❌ stopwords not available:", e)
    
    try:
        from nltk.stem import WordNetLemmatizer
        lemmatizer = WordNetLemmatizer()
        test_word = lemmatizer.lemmatize("running")
        print(f"✅ wordnet: lemmatization working (running → {test_word})")
    except Exception as e:
        print("❌ wordnet not available:", e)
    
    print("\n✅ All tests completed!")


if __name__ == "__main__":
    test_imports()