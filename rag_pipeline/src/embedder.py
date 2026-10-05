import random

class Embedder:
    def __init__(self, model_name='sentence-transformers/all-MiniLM-L6-v2'):
        self.use_mock = False
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
        except Exception as e:
            print(f"\n[Warning] Could not load ML model due to environment error: {e}")
            print("[Warning] Falling back to dummy 384-dimensional embeddings to continue pipeline testing.\n")
            self.use_mock = True
        
    def embed_batch(self, texts):
        if not texts:
            return []
            
        if self.use_mock:
            return [[random.uniform(-1, 1) for _ in range(384)] for _ in texts]
            
        embeddings = self.model.encode(texts, batch_size=32, convert_to_numpy=True)
        return embeddings.tolist()
