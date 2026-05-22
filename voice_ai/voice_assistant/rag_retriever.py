import os
from sqlalchemy import create_engine, text
from .medical_embedding import embed_medical_text

class RAGRetriever:
    def __init__(self, top_k: int = 3, min_score: float = 0.35):
        self.top_k = top_k
        self.min_score = min_score
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            raise RuntimeError("DATABASE_URL not set")

        self.engine = create_engine(db_url)
        self.warmup()

    def warmup(self):
        _ = embed_medical_text("query: warmup")
        with self.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.execute(text("SELECT title FROM medical_voice LIMIT 1")).fetchall()

    def retrieve(self, query: str):
        embedding = embed_medical_text(f"query: {query}")

        sql = text("""
            SELECT
                title,
                question,
                answer,
                symptoms,
                treatment,
                1 - (embedding <=> CAST(:embedding AS vector)) AS score
            FROM medical_voice
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :top_k
        """)

        results = []
        with self.engine.connect() as conn:
            rows = conn.execute(
                sql,
                {"embedding": embedding, "top_k": self.top_k}
            ).fetchall()

            for row in rows:
                if row.score < self.min_score:
                    continue

                content = f"""
                            Tiêu đề: {row.title}
                            Câu hỏi: {row.question}

                            Giải thích:
                            {row.answer}

                            Triệu chứng:
                            {row.symptoms}

                            Điều trị & chăm sóc:
                            {row.treatment}
                            """.strip()

                results.append({"score": float(row.score), "content": content})

        return results
