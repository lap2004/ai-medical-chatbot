# app/routers/voice.py
from __future__ import annotations

from pathlib import Path
from typing import Optional, Any, Dict
import asyncio

from fastapi import APIRouter, Form, HTTPException, UploadFile, File, Depends
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.utils.audio import save_upload_to_temp
from app.services.stt_service import transcribe_audio
from app.services.tts_service import synthesize_speech
from app.rag.chat_pipeline import run as run_rag_pipeline

from app.services.chat_service import handle_chat_request
from app.utils.security import get_current_user
from db.models.conversation_model import Conversation
from db.models.user_model import User
from db.schemas.chat_schema import ChatRequest, ChatResponse
from db.database import get_db

from gtts.lang import tts_langs

router = APIRouter(prefix="/voice", tags=["voice"])


# ------------------------- Helpers -------------------------
def _normalize_lang(lang: Optional[str]) -> Optional[str]:
    """Normalize 'vi-VN' -> 'vi'. Return None if empty."""
    if not lang:
        return None
    _lang = lang.strip().lower()
    if not _lang:
        return None
    if "-" in _lang:
        _lang = _lang.split("-")[0]
    return _lang or None


async def _stt_to_text(tmp_path: str, language: Optional[str]) -> str:
    """
    STT bằng faster-whisper (transcribe_audio hiện là sync).
    Dùng asyncio.to_thread để tránh block event loop.
    """
    _lang = _normalize_lang(language)
    text = await asyncio.to_thread(transcribe_audio, tmp_path, _lang)
    return (text or "").strip()


def _extract_answer_text(answer_obj: Any) -> str:
    """
    RAG pipeline của bạn trả về `answer` có thể là:
    - dict: {"answer": "...", ...}
    - string
    - object có attr .answer
    """
    if answer_obj is None:
        return ""

    if isinstance(answer_obj, str):
        return answer_obj.strip()

    if isinstance(answer_obj, dict):
        val = answer_obj.get("answer")
        return (val or "").strip() if isinstance(val, str) else str(val or "").strip()

    # pydantic/model object?
    val = getattr(answer_obj, "answer", None)
    if isinstance(val, str):
        return val.strip()

    # fallback
    return str(answer_obj).strip()


# ------------------------- Health / Debug -------------------------
@router.get("/ffmpeg_check")
def ffmpeg_check():
    """Giúp debug: tiến trình uvicorn có thấy ffmpeg chưa?"""
    import os, shutil

    return {
        "FFMPEG_BIN_env": getattr(settings, "ffmpeg_bin", ""),
        "which_ffmpeg": shutil.which("ffmpeg"),
        "PATH_sample": (os.getenv("PATH", "") or "")[:200] + "...",
    }


# ------------------------- TTS (free, gTTS) -------------------------
@router.post("/tts")
async def tts_endpoint(
    text: str = Form(...),
    lang: Optional[str] = Form(default=None),
):
    """
    Nhận text -> tạo mp3 bằng gTTS -> trả đường dẫn static.
    """
    try:
        _text = (text or "").strip()
        if not _text:
            raise HTTPException(status_code=400, detail="Thiếu 'text' để chuyển TTS.")

        supported = tts_langs()  # dict code -> name
        _lang = _normalize_lang(lang) or _normalize_lang(getattr(settings, "tts_language", None)) or "vi"

        if _lang not in supported:
            raise HTTPException(
                status_code=400,
                detail=f"Ngôn ngữ không hỗ trợ: '{_lang}'. "
                       f"Hãy dùng 1 trong các mã: {', '.join(sorted(supported.keys()))}",
            )

        out_dir = getattr(settings, "audio_output_dir", None) or "data/audio"
        audio_path = await asyncio.to_thread(synthesize_speech, _text, out_dir, _lang)

        filename = Path(audio_path).name
        return {"audio_path": f"/static/audio/{filename}"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("TTS failed")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------- STT -> RAG (text) -------------------------
@router.post("/stt")
async def stt_endpoint(
    file: UploadFile = File(...),
    language: Optional[str] = Form(default=None),  # "vi", "en"; None = auto
    db: AsyncSession = Depends(get_db),
):
    """
    Voice -> STT -> RAG
    Trả về:
      - transcript
      - answer
      - contexts
    """
    tmp_path: Optional[str] = None
    try:
        if not file or not getattr(file, "filename", ""):
            raise HTTPException(status_code=400, detail="Thiếu file audio để STT.")

        tmp_path = save_upload_to_temp(file)

        # 1) STT
        transcript = await _stt_to_text(tmp_path, language)
        if not transcript:
            raise HTTPException(status_code=400, detail="Không nhận diện được giọng nói (transcript rỗng).")

        # 2) RAG
        rag_out: Dict[str, Any] = await run_rag_pipeline(transcript, db)

        return {
            "transcript": transcript,
            "answer": rag_out.get("answer"),
            "contexts": rag_out.get("contexts", []),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Voice STT+RAG failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Nếu muốn xóa file tạm:
        # if tmp_path:
        #     try: Path(tmp_path).unlink(missing_ok=True)
        #     except Exception: pass
        pass

@router.post("/chat")
async def voice_chat(
    file: UploadFile = File(...),
    stt_language: Optional[str] = Form(default=None),
    tts: bool = Form(default=False),  # ✅ client bật thì tạo mp3
    tts_language: Optional[str] = Form(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    Audio -> STT -> RAG -> (optional) TTS

    Response luôn có:
      - transcript
      - answer
      - contexts

    Nếu tts=true thì có thêm:
      - tts_audio_path
    """
    tmp_path: Optional[str] = None
    try:
        if not file or not getattr(file, "filename", ""):
            raise HTTPException(status_code=400, detail="Thiếu file audio.")

        # 1) save temp
        tmp_path = save_upload_to_temp(file)

        # 2) STT
        transcript = await _stt_to_text(tmp_path, stt_language)
        if not transcript:
            raise HTTPException(status_code=400, detail="Không nhận diện được lời nói.")

        # 3) RAG
        rag_out: Dict[str, Any] = await run_rag_pipeline(transcript, db)
        answer_obj = rag_out.get("answer")
        contexts = rag_out.get("contexts", [])

        # Base response (luôn có 3)
        resp: Dict[str, Any] = {
            "transcript": transcript,
            "answer": answer_obj,
            "contexts": contexts,
            "tts_audio_path": None,
        }

        # 4) optional TTS
        if tts:
            tts_text = _extract_answer_text(answer_obj) or "Xin lỗi, tôi chưa có câu trả lời phù hợp."
            _tts_lang = _normalize_lang(tts_language) or _normalize_lang(getattr(settings, "tts_language", None)) or "vi"

            supported = tts_langs()
            if _tts_lang not in supported:
                _tts_lang = "vi"

            out_dir = getattr(settings, "audio_output_dir", None) or "data/audio"
            audio_path = await asyncio.to_thread(synthesize_speech, tts_text, out_dir, _tts_lang)
            filename = Path(audio_path).name
            resp["tts_audio_path"] = f"/static/audio/{filename}"

        return resp

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("voice_chat failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        pass
    
    
from uuid import UUID

@router.post("/voice")
async def voice_voice(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = Form(default=None),  # ✅ thêm vào
    stt_language: Optional[str] = Form(default=None),
    tts: bool = Form(default=False),
    tts_language: Optional[str] = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Audio -> STT -> Chat (lưu DB theo schema messages_012026) -> optional TTS

    Nếu client không truyền conversation_id:
      - tự tạo conversation mới cho user
    """
    tmp_path: Optional[str] = None
    try:
        if not file or not getattr(file, "filename", ""):
            raise HTTPException(status_code=400, detail="Thiếu file audio.")

        # 1) save temp
        tmp_path = save_upload_to_temp(file)

        # 2) STT
        transcript = await _stt_to_text(tmp_path, stt_language)
        if not transcript:
            raise HTTPException(status_code=400, detail="Không nhận diện được lời nói.")

        # 3) Resolve conversation_id (UUID). Auto-create nếu thiếu.
        conv_id: Optional[UUID] = None
        if conversation_id:
            try:
                conv_id = UUID(conversation_id)
            except Exception:
                raise HTTPException(status_code=400, detail="conversation_id không hợp lệ (phải là UUID).")

        if conv_id is None:
            # ✅ tự tạo conversation mới
            conv = Conversation(
                user_id=int(current_user.id),
                title="New chat",
            )
            db.add(conv)
            await db.flush()  # lấy conv.id
            conv_id = conv.id
            await db.commit()  # commit để chắc chắn tồn tại

        # 4) Chat chuẩn như /chat (lưu DB user + assistant)
        chat_resp: ChatResponse = await handle_chat_request(
            ChatRequest(question=transcript),
            db,
            current_user,
            conv_id,   # ✅ truyền conversation_id
        )

        # 5) optional TTS
        tts_audio_path = None
        if tts:
            answer_text = (chat_resp.answer.answer or "").strip() if chat_resp.answer else ""
            if not answer_text:
                answer_text = "Xin lỗi, tôi chưa có câu trả lời phù hợp."

            _tts_lang = _normalize_lang(tts_language) or _normalize_lang(getattr(settings, "tts_language", None)) or "vi"
            supported = tts_langs()
            if _tts_lang not in supported:
                _tts_lang = "vi"

            out_dir = getattr(settings, "audio_output_dir", None) or "data/audio"
            audio_path = await asyncio.to_thread(synthesize_speech, answer_text, out_dir, _tts_lang)
            filename = Path(audio_path).name
            tts_audio_path = f"/static/audio/{filename}"

        return {
            "conversation_id": str(conv_id),   # ✅ trả về để client reuse cho lần sau
            "transcript": transcript,
            "chat": chat_resp.model_dump(),    # pydantic v2
            "tts_audio_path": tts_audio_path,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("voice_voice failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        pass
