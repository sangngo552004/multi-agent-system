"""Service for generating vector embeddings."""

import logging
from typing import List

from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Use a fast, local embedding model that doesn't cost API credits.
# all-MiniLM-L6-v2 outputs 384-dimensional vectors.
MODEL_NAME = "all-MiniLM-L6-v2"


class EmbeddingService:
    def __init__(self):
        self.model = None

    def load_model(self):
        """Loads the embedding model into memory."""
        if self.model is None:
            logger.info(f"Loading embedding model: {MODEL_NAME}")
            self.model = SentenceTransformer(MODEL_NAME)
            logger.info("Embedding model loaded successfully.")

    def get_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single string."""
        self.load_model()
        # Convert to float list for pgvector compatibility
        embedding = self.model.encode(text)
        return embedding.tolist()

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of strings."""
        if not texts:
            return []
        self.load_model()
        embeddings = self.model.encode(texts)
        return embeddings.tolist()


# Global singleton instance
embedding_service = EmbeddingService()
