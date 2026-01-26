# """
# app/rag/chat_pipeline.py
# Kết nối các bước: retrieve → (rerank nếu có) → prompt → Gemini → parse JSON
# """

# from typing import Dict, Any, List

# from sqlalchemy.orm import Session
# from app.config import settings
# from app.rag.retriever import retrieve
# from app.rag.llm_chain import build_answer


# def run(question: str, db: Session) -> Dict[str, Any]:
#     """
#     Trả về:
#     {
#       "answer": {...},
#       "contexts": [ ... ]
#     }
#     """
#     # 1) Retrieval
#     contexts: List[Dict[str, Any]] = retrieve(db, question, top_k=settings.qa_topk)

#     # (Tuỳ chọn) Rerank tại đây nếu bạn thêm module cross-encoder

#     # 2) Gọi LLM (Gemini) theo guardrails → JSON
#     answer = build_answer(question, contexts)

#     return {"answer": answer, "contexts": contexts}

"""
app/rag/chat_pipeline.py
Kết nối các bước: retrieve → prompt → Gemini → parse JSON
"""

from typing import Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.rag.retriever import retrieve
from app.rag.llm_chain import build_answer


async def run(question: str, db: AsyncSession) -> Dict[str, Any]:
    """
    Trả về:
    {
      "answer": {...},
      "contexts": [ ... ]
    }
    """
    # 1) Retrieval (async)
    contexts: List[Dict[str, Any]] = await retrieve(db, question, top_k=settings.qa_topk)

    # 2) LLM (Gemini) (build_answer hiện sync -> OK)
    answer = build_answer(question, contexts)

    return {"answer": answer, "contexts": contexts}
