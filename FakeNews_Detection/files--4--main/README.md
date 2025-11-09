# Fake News Detection System

A machine learning-based system for detecting fake news articles using Natural Language Processing (NLP) techniques.

## Features

- **Multiple ML Models**: Support for Logistic Regression, Naive Bayes, Random Forest, and Gradient Boosting
- **Text Preprocessing**: Advanced text cleaning, stopword removal, and lemmatization
- **TF-IDF Vectorization**: Converts text into numerical features using Term Frequency-Inverse Document Frequency
- **Probability Scores**: Provides confidence scores for predictions
- **Model Persistence**: Save and load trained models
- **Easy to Use**: Simple API for training and prediction

## Installation

```bash
pip install -r requirements.txt
```

After installation, download required NLTK data:

```python
import nltk
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')
```

## Usage

### Training a Model

```python
from fake_news_model import FakeNewsDetector, load_data
from sklearn.model_selection import train_test_split

# Load your dataset (CSV with 'text' and 'label' columns)
X, y = load_data('your_dataset.csv')

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Initialize detector
detector = FakeNewsDetector(model_type='logistic')

# Train model
detector.train(X_train, y_train)

# Evaluate
detector.evaluate(X_test, y_test)

# Save model
detector.save_model('my_model.pkl')
```

### Making Predictions

```python
from fake_news_model import FakeNewsDetector

# Load trained model
detector = FakeNewsDetector()
detector.load_model('my_model.pkl')

# Predict single article
article = "Your news article text here..."
result = detector.predict_single(article)

print(f"Prediction: {result['label']}")
print(f"Confidence: {result['confidence']:.2f}%")
```

### Using the Prediction Script

```bash
# Predict from command line
python predict.py "Your news article text here..."
```

### Training Script

```bash
# Train and evaluate all models
python train_model.py
```

## Model Types

- **logistic**: Logistic Regression (Fast, good baseline)
- **naive_bayes**: Multinomial Naive Bayes (Fast, works well with text)
- **random_forest**: Random Forest Classifier (More accurate, slower)
- **gradient_boost**: Gradient Boosting (Most accurate, slowest)

## Dataset Format

Your dataset should be a CSV file with the following columns:

- `text`: The news article text
- `label`: 0 for real news, 1 for fake news

Example:
```csv
text,label
"Scientists discover new breakthrough...",0
"SHOCKING: Aliens confirmed by...",1
```

## Model Architecture

1. **Text Preprocessing**
   - Lowercase conversion
   - URL removal
   - Special character removal
   - Stopword removal
   - Lemmatization

2. **Feature Extraction**
   - TF-IDF Vectorization
   - Max 5000 features
   - Unigrams and bigrams

3. **Classification**
   - Multiple ML algorithms
   - Binary classification (Real vs Fake)
   - Probability scores

## Performance Metrics

The system provides:
- Accuracy score
- Classification report (Precision, Recall, F1-score)
- Confusion matrix
- Probability scores for each prediction

## Example Output

```
Prediction: FAKE
Confidence: 87.34%

Detailed Probabilities:
  Real News: 12.66%
  Fake News: 87.34%
```

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

MIT License

## Future Enhancements

- [ ] Deep learning models (LSTM, BERT)
- [ ] Web scraping for real-time news verification
- [ ] API endpoint for web service
- [ ] Multi-language support
- [ ] Fact-checking integration
- [ ] Source credibility analysis