"""
Prediction script for Fake News Detection
"""

from fake_news_model import FakeNewsDetector
import sys

def predict_news(text, model_path='models/fake_news_logistic.pkl'):
    """
    Predict whether a news article is fake or real
    
    Args:
        text: News article text
        model_path: Path to saved model
    """
    # Load model
    detector = FakeNewsDetector()
    detector.load_model(model_path)
    
    # Make prediction
    result = detector.predict_single(text)
    
    # Display results
    print("\n" + "="*60)
    print("FAKE NEWS DETECTION RESULTS")
    print("="*60)
    print(f"\nArticle Text:\n{text[:200]}...")
    print(f"\n{'='*60}")
    print(f"Prediction: {result['label']}")
    print(f"Confidence: {result['confidence']:.2f}%")
    print(f"{'='*60}")
    print(f"Detailed Probabilities:")
    print(f"  Real News: {result['real_probability']:.2f}%")
    print(f"  Fake News: {result['fake_probability']:.2f}%")
    print(f"{'='*60}\n")
    
    return result

if __name__ == "__main__":
    # Example usage
    if len(sys.argv) > 1:
        news_text = " ".join(sys.argv[1:])
    else:
        news_text = "BREAKING: Miracle cure discovered! Doctors hate this simple trick that melts belly fat overnight!"
    
    predict_news(news_text)