import warnings
from pathlib import Path

from fastapi import FastAPI, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


from db.database import SessionLocal
from db.models.user_model import User
from app.config import settings
from app.logger import setup_logger
from app.middleware.log_request import RequestLogMiddleware
from app.services.admin_seed import ensure_single_admin
from app.routers.chat import router as chat_router
from app.routers.voice import router as voice_router
from app.routers import auth
from app.routers.conversations import router as conversations_router
from app.routers.admin import router as admin_router
warnings.filterwarnings("ignore", category=UserWarning, module="ctranslate2")

logger = setup_logger(settings.log_file, settings.log_level)

app = FastAPI(title="AI Bác sĩ (RAG)", version="1.0.0")

app.add_middleware(RequestLogMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://amongst-audio-crossing-packs.trycloudflare.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://kltn-vlu.vercel.app"
    ],
    allow_credentials=True,  
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("data/audio").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")
Path(settings.uploads_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")

app.include_router(chat_router)
app.include_router(voice_router)
app.include_router(auth.router)
app.include_router(conversations_router)
@app.get("/", tags=["meta"])
async def root():
    return {"status": "ok", "service": "ai-doctor", "version": "1.0.0"}

@app.get("/health", tags=["meta"])
async def health():
    return {"ok": True}

@app.get("/info", tags=["meta"])
async def info():
    return {
        "embedding_model": settings.embedding_model,
        "embedding_dim": settings.embedding_dim,
        "rag_table": settings.rag_table,
        "qa_topk": settings.qa_topk,
        "gemini_model": settings.gemini_model,
    }

app.include_router(admin_router)
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        ensure_single_admin(db)
        logger.info("Startup completed: admin ensured.")
    finally:
        db.close()
