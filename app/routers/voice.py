
# # app/routers/voice.py
# from pathlib import Path
# from typing import Optional

# from fastapi import APIRouter, Form, HTTPException, UploadFile, File, Depends
# from loguru import logger
# from sqlalchemy.orm import Session

# from app.config import settings
# from app.services.tts_service import synthesize_speech
# from app.services.stt_service import transcribe_audio
# from app.utils.audio import save_upload_to_temp  # ✅ sửa path util đúng
# from app.services.chat_service import handle_chat_request
# from db.schemas.chat_schema import ChatRequest
# from db.database import get_db
# from gtts.lang import tts_langs

# router = APIRouter(prefix="/voice", tags=["voice"])


# # ------------------------- Health / Debug -------------------------
# @router.get("/ffmpeg_check")
# def ffmpeg_check():
#     """Giúp debug: tiến trình uvicorn có thấy ffmpeg chưa?"""
#     import os, shutil
#     return {
#         "FFMPEG_BIN_env": getattr(settings, "ffmpeg_bin", ""),
#         "which_ffmpeg": shutil.which("ffmpeg"),
#         "PATH_sample": os.getenv("PATH", "")[:200] + "...",
#     }


# # ------------------------- TTS (free, gTTS) -------------------------
# @router.post("/tts")
# async def tts_endpoint(
#     text: str = Form(...),
#     lang: Optional[str] = Form(default=None),
# ):
#     try:
#         _text = (text or "").strip()
#         if not _text:
#             raise HTTPException(status_code=400, detail="Thiếu 'text' để chuyển TTS.")

#         # danh sách ngôn ngữ gTTS hỗ trợ (dict: code->name)
#         supported = tts_langs()
#         # chọn lang: ưu tiên form -> settings -> "vi"
#         _lang = (lang or settings.tts_language or "vi").strip().lower()
#         # chuẩn hoá "vi-vn" -> "vi"
#         if "-" in _lang:
#             _lang = _lang.split("-")[0]

#         if _lang not in supported:
#             # gợi ý các mã gần giống (tuỳ chọn)
#             hint = []
#             for code in supported:
#                 if _lang in code or code in _lang:
#                     hint.append(code)
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"Ngôn ngữ không hỗ trợ: '{_lang}'. Hãy dùng 1 trong các mã: {', '.join(sorted(supported.keys()))}"
#             )

#         out_dir = settings.audio_output_dir or "data/audio"
#         audio_path = synthesize_speech(_text, out_dir=out_dir, lang=_lang)
#         filename = Path(audio_path).name
#         return {"audio_path": f"/static/audio/{filename}"}

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.exception("TTS failed")
#         raise HTTPException(status_code=500, detail=str(e))


# # ------------------------- STT (free, faster-whisper) -------------------------
# @router.post("/stt")
# async def stt_endpoint(
#     file: UploadFile = File(...),
#     language: Optional[str] = Form(default=None),   # ví dụ: "vi", "en"; None = auto
# ):
#     """
#     STT miễn phí bằng faster-whisper. Nhận file audio, trả transcript text.
#     Hỗ trợ mp3/m4a/wav/webm/ogg... (cần ffmpeg).
#     """
#     tmp_path: Optional[str] = None
#     try:
#         # Validate file cơ bản
#         if not file or not getattr(file, "filename", ""):
#             raise HTTPException(status_code=400, detail="Thiếu file audio để STT.")

#         # Lưu file upload tạm
#         tmp_path = save_upload_to_temp(file)

#         # Ngôn ngữ: nếu client không truyền, để None (auto-detect)
#         _lang = None
#         if language:
#             _lang = language.split("-")[0]  # "vi-VN" -> "vi"

#         text = transcribe_audio(tmp_path, language=_lang)
#         return {"text": text}

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.exception("STT failed")
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         # Tuỳ bạn: muốn giữ file tạm để debug thì comment dòng xóa
#         # from os import remove
#         # if tmp_path:
#         #     try: Path(tmp_path).unlink(missing_ok=True)
#         #     except Exception: pass
#         pass


# # --------------- End-to-end: Audio -> STT -> RAG -> TTS ----------------
# @router.post("/voice_chat")
# async def voice_chat(
#     file: UploadFile = File(...),
#     user_id: Optional[str] = Form(default=None),
#     stt_language: Optional[str] = Form(default=None),   # ngôn ngữ cho STT; None = auto
#     tts_language: Optional[str] = Form(default=None),   # ngôn ngữ cho TTS kết quả
#     db: Session = Depends(get_db),
# ):
#     """
#     Pipeline có RAG:
#       1) STT: chuyển giọng nói người dùng -> text
#       2) Chat (RAG): gọi handle_chat_request(...) để truy xuất KB và tạo câu trả lời
#       3) TTS: đọc to câu trả lời -> mp3 (để client nghe)

#     Trả về:
#       - question_text: text sau STT
#       - answer: JSON theo schema ChatResponse của bạn (resp.answer)
#       - contexts: các ngữ cảnh RAG (resp.contexts)
#       - tts_audio_path: đường dẫn mp3 (/static/audio/...)
#     """
#     tmp_path: Optional[str] = None
#     try:
#         # (1) STT
#         tmp_path = save_upload_to_temp(file)
#         _stt_lang = stt_language.split("-")[0] if stt_language else None
#         question_text = transcribe_audio(tmp_path, language=_stt_lang)

#         if not question_text or not question_text.strip():
#             raise HTTPException(status_code=400, detail="Không nhận diện được lời nói.")

#         # (2) Chat (RAG)
#         req = ChatRequest(question=question_text, user_id=user_id)
#         resp = await handle_chat_request(req, db)

#         # (3) TTS đọc câu trả lời chính
#         tts_text = getattr(getattr(resp, "answer", None), "answer", None)
#         if not isinstance(tts_text, str) or not tts_text.strip():
#             tts_text = str(getattr(resp, "answer", "")) or "Xin lỗi, tôi chưa có câu trả lời phù hợp."

#         _tts_lang = (tts_language or settings.tts_language or "vi").split("-")[0]
#         audio_path = synthesize_speech(tts_text, out_dir=settings.audio_output_dir or "data/audio", lang=_tts_lang)
#         filename = Path(audio_path).name

#         return {
#             "question_text": question_text,
#             "answer": resp.answer,            # JSON theo schema của bạn
#             "contexts": getattr(resp, "contexts", []),
#             "tts_audio_path": f"/static/audio/{filename}",
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.exception("voice_chat failed")
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         # Tuỳ bạn: dọn file tạm
#         # if tmp_path:
#         #     try: Path(tmp_path).unlink(missing_ok=True)
#         #     except Exception: pass
#         pass


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


# --------------- End-to-end: Audio -> STT -> RAG -> TTS ----------------
# @router.post("/voice_chat")
# async def voice_chat(
#     file: UploadFile = File(...),
#     user_id: Optional[str] = Form(default=None),
#     stt_language: Optional[str] = Form(default=None),  # ngôn ngữ cho STT; None = auto
#     tts_language: Optional[str] = Form(default=None),  # ngôn ngữ cho TTS kết quả
#     db: AsyncSession = Depends(get_db),
# ):
#     """
#     Pipeline end-to-end:
#       1) STT -> question_text
#       2) RAG -> answer + contexts
#       3) TTS -> mp3 đọc answer

#     Trả về:
#       - question_text
#       - answer
#       - contexts
#       - tts_audio_path
#     """
#     tmp_path: Optional[str] = None
#     try:
#         if not file or not getattr(file, "filename", ""):
#             raise HTTPException(status_code=400, detail="Thiếu file audio.")

#         # (1) STT
#         tmp_path = save_upload_to_temp(file)
#         question_text = await _stt_to_text(tmp_path, stt_language)
#         if not question_text:
#             raise HTTPException(status_code=400, detail="Không nhận diện được lời nói.")

#         # (2) RAG (dùng transcript làm câu hỏi)
#         rag_out: Dict[str, Any] = await run_rag_pipeline(question_text, db)
#         answer_obj = rag_out.get("answer")
#         contexts = rag_out.get("contexts", [])

#         # (3) TTS đọc câu trả lời chính
#         tts_text = _extract_answer_text(answer_obj) or "Xin lỗi, tôi chưa có câu trả lời phù hợp."
#         _tts_lang = _normalize_lang(tts_language) or _normalize_lang(getattr(settings, "tts_language", None)) or "vi"

#         # validate TTS lang (gTTS)
#         supported = tts_langs()
#         if _tts_lang not in supported:
#             # fallback sang vi
#             _tts_lang = "vi"

#         out_dir = getattr(settings, "audio_output_dir", None) or "data/audio"
#         audio_path = await asyncio.to_thread(synthesize_speech, tts_text, out_dir, _tts_lang)
#         filename = Path(audio_path).name

#         return {
#             "question_text": question_text,
#             "answer": answer_obj,
#             "contexts": contexts,
#             "tts_audio_path": f"/static/audio/{filename}",
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.exception("voice_chat failed")
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         # Tuỳ bạn: dọn file tạm
#         # if tmp_path:
#         #     try: Path(tmp_path).unlink(missing_ok=True)
#         #     except Exception: pass
#         pass

from typing import Literal

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
