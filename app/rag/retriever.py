from __future__ import annotations
from typing import Any, Dict, List, Optional
import asyncio
import numpy as np
from loguru import logger
from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession
from pgvector.sqlalchemy import Vector
from app.config import settings

_q_model = None
_q_model_lock = asyncio.Lock()

async def _get_q_model():
    global _q_model

    if settings.use_fake_embedder:
        return None

    if _q_model is not None:
        return _q_model

    async with _q_model_lock:
        if _q_model is None:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading query embedding model: {settings.embedding_model}")
            _q_model = SentenceTransformer(settings.embedding_model)
    return _q_model

async def _embed_query(query: str) -> np.ndarray:
    if settings.use_fake_embedder:
        return np.zeros((settings.embedding_dim,), dtype=float)

    model = await _get_q_model()
    v = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
    if v.shape[0] != settings.embedding_dim:
        raise ValueError(
            f"Embedding dim mismatch: query={v.shape[0]} vs configured={settings.embedding_dim}"
        )

    return v.astype(float)

async def retrieve(
    db: AsyncSession,
    question: str,
    top_k: Optional[int] = None,
) -> List[Dict[str, Any]]:
    if top_k is None:
        top_k = settings.qa_topk

    qvec = await _embed_query(question)

    sql = (
        text(
            f"""
            SELECT id, title, question, answer, symptoms, treatment,
                   1 - (embedding <#> :q) AS score
            FROM {settings.rag_table}
            ORDER BY embedding <#> :q
            LIMIT :k
            """
        )
        .bindparams(
            bindparam("q", type_=Vector(settings.embedding_dim)),
            bindparam("k"),
        )
    )

    result = await db.execute(sql, {"q": qvec.tolist(), "k": int(top_k)})
    rows = result.mappings().all()

    results: List[Dict[str, Any]] = []
    for r in rows:
        merged_text = "\n".join(
            filter(
                None,
                [
                    f"Title: {r.get('title')}",
                    f"Question: {r.get('question')}",
                    f"Answer: {r.get('answer')}",
                    f"Symptoms: {r.get('symptoms')}" if r.get("symptoms") else None,
                    f"Treatment: {r.get('treatment')}" if r.get("treatment") else None,
                ],
            )
        )

        results.append(
            {
                "doc_id": settings.rag_table,
                "chunk_id": str(r["id"]),
                "text": merged_text,
                "score": float(r["score"]),
            }
        )

    return results
