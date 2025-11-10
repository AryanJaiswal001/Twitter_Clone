"""
Fake News Detection API Server
Flask microservice that exposes the fake news model as a REST API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from fake_news_model import FakeNewsDetector  # ✅ FIXED: Correct module name
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize model (global variable so we only train once)
detector = None

def initialize_model():
    """
    Initialize and train the fake news detection model
    This runs once when the server starts
    """
    global detector
    
    logger.info("🎓 Initializing Fake News Detection Model...")
    
    # Create detector instance
    detector = FakeNewsDetector(model_type='logistic')
    
    # Training data
    X_train = [
        "Scientists discover new breakthrough in cancer research at major university",
        "SHOCKING: Aliens confirmed by government officials, click here now!!!",
        "Stock market closes higher as investors welcome economic data",
        "You won't believe what this celebrity said! Doctors hate this one trick!",
        "Breaking: Climate change report shows rising global temperatures",
        "Miracle weight loss cure discovered! No diet or exercise needed!",
        "Government announces new infrastructure spending plan",
        "URGENT: Send money now to claim your prize!!!",
        "University researchers publish peer-reviewed study on renewable energy",
        "CLICK NOW: Secret method to get rich quick without any work!!!",
    ]
    
    y_train = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1]  # 0=Real, 1=Fake
    
    # Train the model
    detector.train(X_train, y_train)
    
    logger.info("✅ Model trained and ready!")
    


@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    Used to verify the server is running
    """
    return jsonify({
        'status': 'healthy',
        'service': 'Fake News Detection API',
        'model_loaded': detector is not None
    }), 200


@app.route('/analyze', methods=['POST'])  # ✅ FIXED: Changed from /health to /analyze
def analyze_text():
    """
    Main endpoint: Analyze text for fake news
    
    Expected request body:
    {
        "text": "Some news article or tweet content"
    }
    
    Returns:
    {
        "success": true,
        "data": {
            "label": "FAKE" or "REAL",
            "confidence": 85.5,
            "fake_probability": 85.5,
            "real_probability": 14.5
        }
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate input
        if not data or 'text' not in data:
            logger.warning("❌ Missing 'text' field in request")
            return jsonify({
                'success': False,
                'error': 'Missing "text" field in request body'
            }), 400
        
        text = data['text'].strip()
        
        # Validate text is not empty
        if not text:
            logger.warning("❌ Empty text provided")
            return jsonify({
                'success': False,
                'error': 'Text cannot be empty'
            }), 400
        
        logger.info(f"📝 Analyzing text: {text[:50]}...")
        
        # Run prediction
        result = detector.predict_single(text)
        
        logger.info(f"✅ Prediction: {result['label']} ({result['confidence']:.2f}%)")
        
        # Return result
        return jsonify({
            'success': True,
            'data': {
                'label': result['label'],
                'confidence': round(result['confidence'], 2),
                'fake_probability': round(result['fake_probability'], 2),
                'real_probability': round(100 - result['fake_probability'], 2)  # ✅ FIXED: Typo corrected
            }
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error analyzing text: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Analysis failed: {str(e)}'
        }), 500


@app.route('/', methods=['GET'])
def home():
    """
    Root endpoint - API documentation
    """
    return jsonify({
        'service': 'Fake News Detection API',
        'version': '1.0.0',
        'endpoints': {
            '/health': 'GET - Health check',
            '/analyze': 'POST - Analyze text for fake news (requires JSON body with "text" field)',
        },
        'example_request': {
            'url': '/analyze',
            'method': 'POST',
            'body': {
                'text': 'Your news article or tweet content here'
            }
        }
    }), 200


if __name__ == '__main__':
    # Initialize model before starting server
    initialize_model()
    
    # Start Flask server
    logger.info("🚀 Starting Flask server on http://localhost:5000")
    logger.info("📡 Ready to receive requests from Node.js backend")
    
    app.run(
        host='0.0.0.0',  # Listen on all network interfaces
        port=5000,        # Port 5000 (different from Node.js port 4000)
        debug=False       # Disable debug mode for stability
    )