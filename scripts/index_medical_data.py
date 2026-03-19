import json
import logging
from sqlalchemy import create_engine, text
from voice_assistant.medical_embedding import embed_medical_passage

DATABASE_URL = "postgresql+psycopg2://aibacsi:123456@127.0.0.1:5432/aibacsi"

logging.basicConfig(level=logging.INFO)
engine = create_engine(DATABASE_URL)


def build_medical_passage(item: dict) -> str:
    parts = []
    parts.append(f"Tiêu đề: {item['title']}")
    parts.append(f"Câu hỏi: {item['question']}")
    parts.append(f"Trả lời: {item['answer']}")

    if item.get("symptoms"):
        parts.append(f"Triệu chứng: {item['symptoms']}")

    if item.get("treatment"):
        parts.append(f"Điều trị: {item['treatment']}")

    return "\n".join(parts)

def index_medical_json(json_path: str):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        data = [data]

    with engine.begin() as conn:
        for item in data:
            passage = build_medical_passage(item)
            embedding = embed_medical_passage(passage)

            conn.execute(
                text("""
                    INSERT INTO medical_voice (
                        id,
                        title,
                        question,
                        answer,
                        symptoms,
                        treatment,
                        embedding
                    )
                    VALUES (
                        :id,
                        :title,
                        :question,
                        :answer,
                        :symptoms,
                        :treatment,
                        :embedding
                    )
                """),
                {
                    "id": item["id"],
                    "title": item["title"],
                    "question": item["question"],
                    "answer": item["answer"],
                    "symptoms": item.get("symptoms"),
                    "treatment": item.get("treatment"),
                    "embedding": embedding,
                }
            )
            logging.info(f"Indexed medical_voice: {item['id']}")

if __name__ == "__main__":
    index_medical_json("medical_data.json")
