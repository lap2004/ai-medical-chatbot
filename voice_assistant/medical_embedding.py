import logging
from sentence_transformers import SentenceTransformer

_model = None


def _load_model():
    global _model
    if _model is None:
        logging.info("Loading E5 embedding model...")
        _model = SentenceTransformer("intfloat/e5-large-v2")
        logging.info("E5 embedding model loaded")
    return _model


def embed_medical_text(text: str) -> list[float]:
    """
    Unified embedding function for medical RAG
    MUST use:
      - prefix: 'query:' or 'passage:'
      - normalize_embeddings=True
    """
    model = _load_model()

    embedding = model.encode(
        text,
        normalize_embeddings=True
    )

    return embedding.tolist()
