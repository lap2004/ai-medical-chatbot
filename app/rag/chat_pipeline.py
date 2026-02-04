from typing import Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.rag.retriever import retrieve
from app.rag.llm_chain import build_answer


async def run(question: str, db: AsyncSession) -> Dict[str, Any]:
    # 1) Retrieval (async)
    contexts: List[Dict[str, Any]] = await retrieve(db, question, top_k=settings.qa_topk)

    # 2) LLM (Gemini) (build_answer hiện sync -> OK)
    answer = build_answer(question, contexts)

    return {"answer": answer, "contexts": contexts}
