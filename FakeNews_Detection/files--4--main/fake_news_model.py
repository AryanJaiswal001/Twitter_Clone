"""
Fake News Detection Model
A machine learning model for detecting fake news using NLP techniques
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import pickle
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

class FakeNewsDetector:
    """
    A comprehensive fake news detection system using multiple ML models
    """
    
    def __init__(self, model_type='logistic'):
        """
        Initialize the fake news detector
        
        Args:
            model_type: Type of model to use ('logistic', 'naive_bayes', 'random_forest', 'gradient_boost')
        """
        self.model_type = model_type
        self.vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
        self.lemmatizer = WordNetLemmatizer()
        
        # Initialize model based on type
        if model_type == 'logistic':
            self.model = LogisticRegression(max_iter=1000, random_state=42)
        elif model_type == 'naive_bayes':
            self.model = MultinomialNB()
        elif model_type == 'random_forest':
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        elif model_type == 'gradient_boost':
            self.model = GradientBoostingClassifier(n_estimators=100, random_state=42)
        else:
            raise ValueError("Invalid model type")
    
    def preprocess_text(self, text):
        """
        Preprocess text data for model input
        
        Args:
            text: Raw text string
            
        Returns:
            Cleaned and preprocessed text
        """
        if not isinstance(text, str):
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        
        # Remove mentions and hashtags
        text = re.sub(r'@\w+|#\w+', '', text)
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Tokenize and remove stopwords
        try:
            stop_words = set(stopwords.words('english'))
        except:
            nltk.download('stopwords')
            stop_words = set(stopwords.words('english'))
        
        # Lemmatization
        try:
            words = text.split()
            words = [self.lemmatizer.lemmatize(word) for word in words if word not in stop_words]
            text = ' '.join(words)
        except:
            nltk.download('wordnet')
            words = text.split()
            words = [self.lemmatizer.lemmatize(word) for word in words if word not in stop_words]
            text = ' '.join(words)
        
        return text
    
    def train(self, X_train, y_train):
        """
        Train the fake news detection model
        
        Args:
            X_train: Training text data
            y_train: Training labels (0 for real, 1 for fake)
        """
        # Preprocess training data
        print("Preprocessing training data...")
        X_train_processed = [self.preprocess_text(text) for text in X_train]
        
        # Vectorize text data
        print("Vectorizing text data...")
        X_train_vectors = self.vectorizer.fit_transform(X_train_processed)
        
        # Train the model
        print(f"Training {self.model_type} model...")
        self.model.fit(X_train_vectors, y_train)
        print("Training complete!")
    
    def predict(self, X_test):
        """
        Predict whether news is fake or real
        
        Args:
            X_test: Test text data
            
        Returns:
            Predictions (0 for real, 1 for fake)
        """
        # Preprocess test data
        X_test_processed = [self.preprocess_text(text) for text in X_test]
        
        # Vectorize test data
        X_test_vectors = self.vectorizer.transform(X_test_processed)
        
        # Make predictions
        predictions = self.model.predict(X_test_vectors)
        
        return predictions
    
    def predict_proba(self, X_test):
        """
        Predict probability of news being fake
        
        Args:
            X_test: Test text data
            
        Returns:
            Probability scores
        """
        # Preprocess test data
        X_test_processed = [self.preprocess_text(text) for text in X_test]
        
        # Vectorize test data
        X_test_vectors = self.vectorizer.transform(X_test_processed)
        
        # Get probability predictions
        probabilities = self.model.predict_proba(X_test_vectors)
        
        return probabilities
    
    def evaluate(self, X_test, y_test):
        """
        Evaluate model performance
        
        Args:
            X_test: Test text data
            y_test: True labels
            
        Returns:
            Dictionary containing evaluation metrics
        """
        predictions = self.predict(X_test)
        
        accuracy = accuracy_score(y_test, predictions)
        report = classification_report(y_test, predictions, target_names=['Real', 'Fake'])
        conf_matrix = confusion_matrix(y_test, predictions)
        
        print(f"\nModel: {self.model_type}")
        print(f"Accuracy: {accuracy:.4f}")
        print(f"\nClassification Report:\n{report}")
        print(f"\nConfusion Matrix:\n{conf_matrix}")
        
        return {
            'accuracy': accuracy,
            'classification_report': report,
            'confusion_matrix': conf_matrix
        }
    
    def predict_single(self, text):
        """
        Predict whether a single news article is fake or real
        
        Args:
            text: News article text
            
        Returns:
            Prediction label and confidence score
        """
        prediction = self.predict([text])[0]
        probabilities = self.predict_proba([text])[0]
        
        label = "FAKE" if prediction == 1 else "REAL"
        confidence = probabilities[prediction] * 100
        
        return {
            'label': label,
            'confidence': confidence,
            'fake_probability': probabilities[1] * 100,
            'real_probability': probabilities[0] * 100
        }
    
    def save_model(self, filepath='fake_news_model.pkl'):
        """
        Save the trained model to disk
        
        Args:
            filepath: Path to save the model
        """
        model_data = {
            'model': self.model,
            'vectorizer': self.vectorizer,
            'model_type': self.model_type
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='fake_news_model.pkl'):
        """
        Load a trained model from disk
        
        Args:
            filepath: Path to load the model from
        """
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.vectorizer = model_data['vectorizer']
        self.model_type = model_data['model_type']
        
        print(f"Model loaded from {filepath}")


def load_data(filepath):
    """
    Load dataset for training
    
    Args:
        filepath: Path to CSV file with columns ['text', 'label']
        
    Returns:
        X, y data splits
    """
    df = pd.read_csv(filepath)
    X = df['text'].values
    y = df['label'].values  # 0 for real, 1 for fake
    
    return X, y


def main():
    """
    Example usage of the Fake News Detection System
    """
    # Example: Load data
    # X, y = load_data('fake_news_dataset.csv')
    
    # Create sample data for demonstration
    X_sample = [
        "Scientists discover new breakthrough in cancer research at major university",
        "SHOCKING: Aliens confirmed by government officials, click here now!!!",
        "Stock market closes higher as investors welcome economic data",
        "You won't believe what this celebrity said! Doctors hate this one trick!",
        "Breaking: Climate change report shows rising global temperatures"
    ]
    
    y_sample = [0, 1, 0, 1, 0]  # 0 = Real, 1 = Fake
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_sample, y_sample, test_size=0.2, random_state=42
    )
    
    # Train multiple models and compare
    models = ['logistic', 'naive_bayes', 'random_forest']
    
    for model_type in models:
        print(f"\n{'='*50}")
        print(f"Training {model_type} model")
        print(f"{'='*50}")
        
        detector = FakeNewsDetector(model_type=model_type)
        detector.train(X_train, y_train)
        
        # Test single prediction
        test_article = "BREAKING: Miracle cure discovered! Doctors shocked!"
        result = detector.predict_single(test_article)
        
        print(f"\nTest Article: {test_article}")
        print(f"Prediction: {result['label']}")
        print(f"Confidence: {result['confidence']:.2f}%")
        print(f"Fake Probability: {result['fake_probability']:.2f}%")
        print(f"Real Probability: {result['real_probability']:.2f}%")
        
        # Save model
        detector.save_model(f'fake_news_{model_type}.pkl')


if __name__ == "__main__":
    main()