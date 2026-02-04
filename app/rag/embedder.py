import os
from typing import List, Dict, Any

import numpy as np
from sqlalchemy import text
from sqlalchemy.orm import Session
from loguru import logger

from app.config import settings

# Lazy load để khởi tạo model 1 lần
_model = None


def _get_model():
    global _model
    if settings.use_fake_embedder:
        return None
    if _model is None:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading embedding model: {settings.embedding_model}")
        _model = SentenceTransformer(settings.embedding_model)
    return _model


def build_embed_text(rec: Dict[str, Any]) -> str:
    parts = []
    if rec.get("title"):
        parts.append(f"Title: {rec['title']}")
    if rec.get("question"):
        parts.append(f"Question: {rec['question']}")
    if rec.get("answer"):
        parts.append(f"Answer: {rec['answer']}")
    if rec.get("symptoms"):
        parts.append(f"Symptoms: {rec['symptoms']}")
    if rec.get("treatment"):
        parts.append(f"Treatment: {rec['treatment']}")
    return "\n".join(parts)


def embed_texts(texts: List[str], batch_size: int = 32) -> np.ndarray:
    """
    Trả về (N, settings.embedding_dim); normalize L2.
    Nếu settings.use_fake_embedder → zero vectors (phục vụ dev/test).
    """
    if settings.use_fake_embedder:
        return np.zeros((len(texts), settings.embedding_dim), dtype=float)

    model = _get_model()
    vecs = model.encode(
        texts,
        batch_size=batch_size,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    if vecs.shape[1] != settings.embedding_dim:
        raise ValueError(
            f"Embedding dim mismatch: model={vecs.shape[1]} vs configured={settings.embedding_dim}"
        )
    return vecs.astype(float)


def upsert_medical(db: Session, rows: List[Dict[str, Any]]):
    """
    Upsert vào bảng medical theo id:
    INSERT ... ON CONFLICT (id) DO UPDATE ...
    """
    if not rows:
        return
    sql = text(f"""
        INSERT INTO {settings.rag_table} (id, title, question, answer, symptoms, treatment, embedding)
        VALUES (:id, :title, :question, :answer, :symptoms, :treatment, :embedding)
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            question = EXCLUDED.question,
            answer = EXCLUDED.answer,
            symptoms = EXCLUDED.symptoms,
            treatment = EXCLUDED.treatment,
            embedding = EXCLUDED.embedding
    """)
    db.execute(sql, rows)


def insert_medical_without_id(db: Session, rows: List[Dict[str, Any]]):
    """
    Insert các bản ghi thiếu id (DB sẽ tự gen id); không thể upsert.
    """
    if not rows:
        return
    sql = text(f"""
        INSERT INTO {settings.rag_table} (title, question, answer, symptoms, treatment, embedding)
        VALUES (:title, :question, :answer, :symptoms, :treatment, :embedding)
    """)
    db.execute(sql, rows)


def embed_and_upsert_records(db: Session, records: List[Dict[str, Any]], batch_size: int = 64):
    """
    Hàm tiện ích: nhận list record (id,title,question,answer,symptoms,treatment),
    tạo embedding, và ghi vào bảng 'medical'.
    """
    texts = [build_embed_text(r) for r in records]
    embs = embed_texts(texts, batch_size=batch_size)

    rows_with_id, rows_no_id = [], []
    for rec, emb in zip(records, embs):
        row = {
            "id": rec.get("id"),
            "title": rec.get("title"),
            "question": rec.get("question"),
            "answer": rec.get("answer"),
            "symptoms": rec.get("symptoms"),
            "treatment": rec.get("treatment"),
            "embedding": np.array(emb, dtype=float),
        }
        if row["id"]:
            rows_with_id.append(row)
        else:
            rows_no_id.append(row)

    if rows_with_id:
        upsert_medical(db, rows_with_id)
    if rows_no_id:
        insert_medical_without_id(db, rows_no_id)

    db.commit()
