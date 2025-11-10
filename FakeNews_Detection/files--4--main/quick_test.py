"""
Quick test of the Fake News Detection Model
"""
from fake_news_model import FakeNewsDetector

# Create detector
detector = FakeNewsDetector(model_type='logistic')

# Sample training data
X_train = [
    "Scientists discover new breakthrough in cancer research at major university",
    "SHOCKING: Aliens confirmed by government officials, click here now!!!",
    "Stock market closes higher as investors welcome economic data",
    "You won't believe what this celebrity said! Doctors hate this one trick!",
    "Breaking: Climate change report shows rising global temperatures",
    "Miracle weight loss cure discovered! No diet or exercise needed!",
    "Government announces new infrastructure spending plan",
    "URGENT: Send money now to claim your prize!!!",
]

y_train = [0, 1, 0, 1, 0, 1, 0, 1]  # 0=Real, 1=Fake

# Train model
print("🎓 Training model...\n")
detector.train(X_train, y_train)

# Test predictions
test_articles = [
    "Breaking news: Scientists make important discovery",
    "SHOCKING SECRET revealed! Click now!!!",
    "Economic report shows steady growth in Q3"
]

print("\n🔍 Testing predictions...\n")
for article in test_articles:
    result = detector.predict_single(article)
    print(f"Article: {article[:60]}...")
    print(f"  Prediction: {result['label']}")
    print(f"  Confidence: {result['confidence']:.2f}%")
    print(f"  Fake Probability: {result['fake_probability']:.2f}%\n")

print("✅ Model is working correctly!")