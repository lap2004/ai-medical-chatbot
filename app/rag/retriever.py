# from typing import List, Dict
# import numpy as np
# from loguru import logger

# from sqlalchemy import text, bindparam
# from sqlalchemy.orm import Session
# from pgvector.sqlalchemy import Vector

# from app.config import settings

# # Model embed query (lazy)
# _q_model = None


# def _get_q_model():
#     global _q_model
#     if settings.use_fake_embedder:
#         return None
#     if _q_model is None:
#         from sentence_transformers import SentenceTransformer
#         logger.info(f"Loading query embedding model: {settings.embedding_model}")
#         _q_model = SentenceTransformer(settings.embedding_model)
#     return _q_model


# def _embed_query(query: str) -> np.ndarray:
#     if settings.use_fake_embedder:
#         return np.zeros((settings.embedding_dim,), dtype=float)
#     m = _get_q_model()
#     v = m.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
#     if v.shape[0] != settings.embedding_dim:
#         raise ValueError(
#             f"Embedding dim mismatch: query={v.shape[0]} vs configured={settings.embedding_dim}"
#         )
#     return v.astype(float)


# def retrieve(db: Session, question: str, top_k: int | None = None) -> List[Dict]:
#     """
#     Trả về danh sách context:
#     {
#       "doc_id": "medical",
#       "chunk_id": "<uuid>",
#       "text": "<tổng hợp fields>",
#       "score": 0.87   # ~ cosine similarity (1 - cosine distance)
#     }
#     """
#     if top_k is None:
#         top_k = settings.qa_topk

#     # 1) Embed câu hỏi
#     qvec = _embed_query(question)

#     # 2) Truy vấn: dùng cosine distance (<#>) và ràng buộc :q là Vector(dim)
#     sql = text(f"""
#         SELECT id, title, question, answer, symptoms, treatment,
#                1 - (embedding <#> :q) AS score
#         FROM {settings.rag_table}
#         ORDER BY embedding <#> :q
#         LIMIT :k
#     """).bindparams(
#         bindparam("q", type_=Vector(settings.embedding_dim)),
#         bindparam("k"),
#     )

#     # rows = db.execute(sql, {"q": qvec.tolist(), "k": int(top_k)}).mappings().all()
#     rows = (await db.execute(sql, {"q": qvec.tolist(), "k": int(top_k)})).mappings().all()


#     # 3) Chuẩn hóa kết quả
#     results: List[Dict] = []
#     for r in rows:
#         merged_text = "\n".join(filter(None, [
#             f"Title: {r['title']}",
#             f"Question: {r['question']}",
#             f"Answer: {r['answer']}",
#             f"Symptoms: {r['symptoms']}" if r.get("symptoms") else None,
#             f"Treatment: {r['treatment']}" if r.get("treatment") else None,
#         ]))
#         results.append({
#             "doc_id": settings.rag_table,
#             "chunk_id": str(r["id"]),
#             "text": merged_text,
#             "score": float(r["score"]),
#         })

#     return results


from __future__ import annotations

from typing import Any, Dict, List, Optional
import asyncio
import numpy as np
from loguru import logger

from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession
from pgvector.sqlalchemy import Vector

from app.config import settings

# Lazy-loaded embedding model (process-level singleton)
_q_model = None
_q_model_lock = asyncio.Lock()


async def _get_q_model():
    """
    Lazy load SentenceTransformer model once per process.
    Using an asyncio lock to avoid concurrent load in async server.
    """
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
    """
    Return normalized embedding vector for query.
    Note: SentenceTransformer.encode is sync and can block the event loop under load.
    For high QPS, you may want to run it in a thread pool (see note below).
    """
    if settings.use_fake_embedder:
        return np.zeros((settings.embedding_dim,), dtype=float)

    model = await _get_q_model()

    # If you want to avoid blocking the event loop, uncomment this pattern:
    # v = await asyncio.to_thread(
    #     model.encode, [query], normalize_embeddings=True, convert_to_numpy=True
    # )
    # v = v[0]

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
    """
    Trả về danh sách context:
    {
      "doc_id": "<table_name>",
      "chunk_id": "<uuid>",
      "text": "<merged fields>",
      "score": 0.87   # ~ cosine similarity (1 - cosine distance)
    }
    """
    if top_k is None:
        top_k = settings.qa_topk

    # 1) Embed câu hỏi
    qvec = await _embed_query(question)

    # 2) Truy vấn: cosine distance (<#>) và ràng buộc :q là Vector(dim)
    #    Lưu ý: settings.rag_table nên là tên bảng an toàn (đã cấu hình nội bộ).
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

    # 3) Chuẩn hóa kết quả
    results: List[Dict[str, Any]] = []
    for r in rows:
        # r là RowMapping -> hỗ trợ dict-like access + get()
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
