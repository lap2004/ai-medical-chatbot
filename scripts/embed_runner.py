#!/usr/bin/env python3
# scripts/embed_runner.py

"""
Nạp & embed dữ liệu y khoa vào Postgres (pgvector) cho bảng `medical`.

Yêu cầu DB:
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE TABLE IF NOT EXISTS medical (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    symptoms TEXT,
    treatment TEXT,
    embedding vector(1024)
  );

ENV tối thiểu (.env):
  DATABASE_URL=postgresql+psycopg2://aibacsi:123456@127.0.0.1:5432/aibacsi
  EMBEDDING_MODEL=BAAI/bge-m3
  EMBEDDING_DIM=1024
  RAG_TABLE=medical
  USE_FAKE_EMBEDDER=0
"""

import argparse
import json
import os
from typing import List, Dict, Any

import numpy as np
from loguru import logger

from sqlalchemy import create_engine, MetaData, Table, Column, Text, text, event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session

from pgvector.sqlalchemy import Vector
from pgvector.psycopg2 import register_vector  # <-- ĐÚNG: dùng bản psycopg2

# .env optional
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

# ========= ENV / CONFIG =========
DATABASE_URL = os.getenv("DATABASE_URL", "")
RAG_TABLE = os.getenv("RAG_TABLE", "medical_012026")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "1024"))
USE_FAKE_EMBEDDER = os.getenv("USE_FAKE_EMBEDDER", "0") in ("1", "true", "True")

if not DATABASE_URL:
    host = os.getenv("PGHOST", "127.0.0.1")
    port = os.getenv("PGPORT", "5432")
    db = os.getenv("PGDATABASE", "aibacsi")
    user = os.getenv("PGUSER", "aibacsi")
    pwd = os.getenv("PGPASSWORD", "123456")
    DATABASE_URL = f"postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{db}"

logger.remove()
logger.add("logs/app.log", rotation="5 MB", retention="10 days", level="INFO")
logger.add(lambda m: print(m, end=""), level="INFO")


# ========= EMBEDDER =========
_model = None

def _get_model():
    global _model
    if USE_FAKE_EMBEDDER:
        return None
    if _model is None:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def embed_texts(texts: List[str], batch_size: int = 32) -> np.ndarray:
    """Trả về (N, EMBEDDING_DIM); normalize L2. Nếu USE_FAKE_EMBEDDER=1 → zero vec."""
    if USE_FAKE_EMBEDDER:
        logger.warning("USE_FAKE_EMBEDDER=1 → dùng embedding zero (dev/test).")
        return np.zeros((len(texts), EMBEDDING_DIM), dtype=float)

    model = _get_model()
    vecs = model.encode(
        texts,
        batch_size=batch_size,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=True,
    )
    if vecs.shape[1] != EMBEDDING_DIM:
        raise ValueError(
            f"Embedding dim mismatch: model={vecs.shape[1]} vs EMBEDDING_DIM={EMBEDDING_DIM}"
        )
    return vecs.astype(float)


# ========= DATA LOADER =========
REQUIRED = ("title", "question", "answer")
FIELDS = ["id", "title", "question", "answer", "symptoms", "treatment"]

def load_records(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("JSON root phải là list các bản ghi.")
    out = []
    for i, rec in enumerate(data):
        if not isinstance(rec, dict):
            logger.warning(f"Bỏ qua phần tử index {i}: không phải object.")
            continue
        item = {k: rec.get(k) for k in FIELDS}
        for k in REQUIRED:
            if not item.get(k):
                raise ValueError(f"Bản ghi index {i} thiếu trường bắt buộc '{k}'")
        out.append(item)
    logger.info(f"Loaded {len(out)} records from {path}")
    return out


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


# ========= TABLE DEF (Core) =========
def make_table(metadata: MetaData) -> Table:
    return Table(
        RAG_TABLE,
        metadata,
        Column("id", UUID(as_uuid=False), primary_key=True),
        Column("title", Text, nullable=False),
        Column("question", Text, nullable=False),
        Column("answer", Text, nullable=False),
        Column("symptoms", Text, nullable=True),
        Column("treatment", Text, nullable=True),
        Column("embedding", Vector(EMBEDDING_DIM), nullable=True),
        extend_existing=True,
    )


def upsert_batch(session: Session, rows: List[Dict[str, Any]]):
    """ON CONFLICT (id) DO UPDATE mọi trường + embedding"""
    if not rows:
        return
    sql = text(f"""
        INSERT INTO {RAG_TABLE} (id, title, question, answer, symptoms, treatment, embedding)
        VALUES (:id, :title, :question, :answer, :symptoms, :treatment, :embedding)
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            question = EXCLUDED.question,
            answer = EXCLUDED.answer,
            symptoms = EXCLUDED.symptoms,
            treatment = EXCLUDED.treatment,
            embedding = EXCLUDED.embedding
    """)
    session.execute(sql, rows)


# ========= MAIN =========
def main(path: str, batch_size: int = 64, truncate: bool = False, dry_run: bool = False):
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL không được đặt. Kiểm tra .env.")

    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

    # 🔑 ĐĂNG KÝ PGVECTOR ĐÚNG CÁCH: đăng ký trên DBAPI connection (KHÔNG truyền engine)
    @event.listens_for(engine, "connect")
    def _on_connect(dbapi_conn, conn_record):
        # dbapi_conn là psycopg2 connection thật
        register_vector(dbapi_conn)

    metadata = MetaData()
    _ = make_table(metadata)  # dùng để biết schema (table đã tạo sẵn trong DB)

    # (tuỳ chọn) xóa hết bảng
    if truncate:
        with engine.begin() as conn:
            logger.warning(f"TRUNCATE TABLE {RAG_TABLE};")
            conn.execute(text(f"TRUNCATE TABLE {RAG_TABLE};"))

    # nạp dữ liệu
    records = load_records(path)
    texts = [build_embed_text(r) for r in records]
    embeddings = embed_texts(texts, batch_size=batch_size)

    # chuẩn bị rows
    rows: List[Dict[str, Any]] = []
    for rec, emb in zip(records, embeddings):
        rows.append({
            "id": rec.get("id"),            # nếu None: không upsert được → sẽ insert riêng
            "title": rec.get("title"),
            "question": rec.get("question"),
            "answer": rec.get("answer"),
            "symptoms": rec.get("symptoms"),
            "treatment": rec.get("treatment"),
            "embedding": np.array(emb, dtype=float),
        })

    with Session(engine) as session:
        if dry_run:
            logger.warning("DRY-RUN: không ghi DB. In 3 dòng mẫu (ẩn embedding).")
            for r in rows[:3]:
                show = {k: (str(v)[:60] + "..." if isinstance(v, str) and len(v) > 60 else v)
                        for k, v in r.items() if k != "embedding"}
                logger.info(show)
            return

        rows_with_id = [r for r in rows if r.get("id")]
        rows_no_id = [r for r in rows if not r.get("id")]

        if rows_with_id:
            logger.info(f"Upsert {len(rows_with_id)} bản ghi có id.")
            upsert_batch(session, rows_with_id)

        if rows_no_id:
            logger.info(f"Insert {len(rows_no_id)} bản ghi thiếu id (DB tự gen).")
            insert_sql = text(f"""
                INSERT INTO {RAG_TABLE} (title, question, answer, symptoms, treatment, embedding)
                VALUES (:title, :question, :answer, :symptoms, :treatment, :embedding)
            """)
            session.execute(insert_sql, rows_no_id)

        session.commit()
        logger.info("Hoàn tất nạp embeddings vào DB.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Embed JSON y khoa vào bảng pgvector (medical_012026).")
    parser.add_argument("--path", default="data/data.json", help="Đường dẫn file JSON.")
    parser.add_argument("--batch-size", type=int, default=64, help="Batch size khi encode.")
    parser.add_argument("--truncate", action="store_true", help="TRUNCATE bảng trước khi nạp.")
    parser.add_argument("--dry-run", action="store_true", help="Không ghi DB, chỉ log.")
    args = parser.parse_args()

    main(
        path=args.path,
        batch_size=args.batch_size,
        truncate=args.truncate,
        dry_run=args.dry_run,
    )
