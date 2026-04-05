import os
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'

from fastembed import TextEmbedding
model = TextEmbedding(model_name='BAAI/bge-small-en-v1.5')
print(f'Model: {model.model_name}')

# Check dimensions
if hasattr(model.model, 'dimensions'):
    print(f'Model dimensions: {model.model.dimensions}')

# Try the correct method
try:
    docs = ['hello world']
    for batch in model.doc_encode(docs):
        print(f'Vector length: {len(batch)}')
except Exception as e:
    print(f'Error with doc_encode: {e}')
    try:
        for embedding in model.embed(docs):
            print(f'Vector length: {len(embedding)}')
    except Exception as e2:
        print(f'Error with embed: {e2}')
