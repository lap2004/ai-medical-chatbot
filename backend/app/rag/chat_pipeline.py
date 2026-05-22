from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.rag.retriever import retrieve
from app.rag.llm_chain import build_answer, contextualize_query

async def run(question: str, db: AsyncSession, history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    if history is None:
        history = []
    if history:
        standalone_question = contextualize_query(question, history)
    else:
        standalone_question = question
        
    # 1) Retrieval (async)
    contexts: List[Dict[str, Any]] = await retrieve(db, standalone_question, top_k=settings.qa_topk)

    # 2) LLM (Gemini) (build_answer hiện sync -> OK)
    answer = build_answer(question, contexts, history)
    return {"answer": answer, "contexts": contexts}

