import nltk

print("Downloading NLTK data...")

packages=[
    'stopwords',  #For removing common words
    'punkt',      #For tokenization
    'wordnet',    #For lexical database
    'omw-1.4',    #For multilingual WordNet
    'averaged_perceptron_tagger'  #For part-of-speech tagging
]

for package in packages:
    print(f"Downloading {package}...")
    try:
        nltk.download(package,quiet=True)
        print(f"{package} downloaded successfully.")
    except Exception as e:  
        print(f"Error downloading {package}: {e}")
print("All NLTK data downloads complete.")
print("You can now run the Fake News Detection model.")
