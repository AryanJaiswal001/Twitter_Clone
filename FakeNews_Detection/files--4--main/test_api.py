"""
Test script for the Fake News Detection API
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    """Test the health check endpoint"""
    print("\n🔍 Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_analyze(text):
    """Test the analyze endpoint"""
    print(f"\n🔍 Testing /analyze endpoint with text: '{text[:50]}...'")
    try:
        response = requests.post(
            f"{BASE_URL}/analyze",
            json={"text": text},
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Status: {response.status_code}")
        result = response.json()
        print(f"📄 Response: {json.dumps(result, indent=2)}")
        
        if result.get('success'):
            data = result['data']
            label = data['label']
            confidence = data['confidence']
            emoji = "🚨" if label == "FAKE" else "✅"
            print(f"\n{emoji} Prediction: {label} (Confidence: {confidence}%)")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("🧪 FAKE NEWS DETECTION API TESTS")
    print("="*60)
    
    # Test 1: Health check
    test_health()
    
    # Test 2: Real news example
    real_news = "Scientists discover new planet orbiting a nearby star. The research was published in Nature journal after peer review."
    test_analyze(real_news)
    
    # Test 3: Fake news example
    fake_news = "BREAKING: Aliens have landed in New York City! Government confirms UFO sighting! Click here NOW!"
    test_analyze(fake_news)
    
    print("\n" + "="*60)
    print("✅ All tests completed!")
    print("="*60)
