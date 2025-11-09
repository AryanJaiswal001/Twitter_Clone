"""
Training script for Fake News Detection Model
"""

from fake_news_model import FakeNewsDetector, load_data
from sklearn.model_selection import train_test_split
import pandas as pd

def train_and_evaluate():
    """
    Train and evaluate the fake news detection model
    """
    # Load your dataset
    # Expected format: CSV with 'text' and 'label' columns
    # label: 0 for real news, 1 for fake news
    
    print("Loading dataset...")
    # X, y = load_data('your_dataset.csv')
    
    # For demonstration with larger sample
    X_demo = [
        "President announces new economic policy during press conference",
        "SHOCKING: Magic weight loss pill melts fat overnight!!!",
        "Research team publishes findings in peer-reviewed journal",
        "Celebrities don't want you to know this secret!",
        "Local community raises funds for new school facilities",
        "URGENT: Forward this or bad luck for 10 years!!!",
        "Supreme Court delivers ruling on constitutional matter",
        "MIRACLE CURE: Doctors hate him for this one simple trick!"
    ] * 10  # Multiply to create larger dataset
    
    y_demo = [0, 1, 0, 1, 0, 1, 0, 1] * 10
    
    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(
        X_demo, y_demo, test_size=0.2, random_state=42, stratify=y_demo
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    
    # Train model (try different models)
    model_types = ['logistic', 'naive_bayes', 'random_forest']
    results = {}
    
    for model_type in model_types:
        print(f"\n{'='*60}")
        print(f"Training with {model_type.upper()} model")
        print(f"{'='*60}")
        
        # Initialize and train
        detector = FakeNewsDetector(model_type=model_type)
        detector.train(X_train, y_train)
        
        # Evaluate
        metrics = detector.evaluate(X_test, y_test)
        results[model_type] = metrics
        
        # Save model
        detector.save_model(f'models/fake_news_{model_type}.pkl')
    
    # Find best model
    best_model = max(results.items(), key=lambda x: x[1]['accuracy'])
    print(f"\n{'='*60}")
    print(f"Best Model: {best_model[0].upper()} with accuracy: {best_model[1]['accuracy']:.4f}")
    print(f"{'='*60}")
    
    return results

if __name__ == "__main__":
    train_and_evaluate()