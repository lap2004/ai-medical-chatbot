import os
import json
import logging
import asyncio
import requests
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from voice_assistant.config import Config
from voice_assistant.api_key_manager import get_tts_api_key
from voice_assistant.text_to_speech import text_to_speech_base64

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

WELCOME_PROMPT = "Xin chào, tôi là trợ lý sức khỏe AI. Tôi có thể giúp gì cho bạn?"
BACKEND_INTERNAL_CHAT_URL = os.getenv("BACKEND_INTERNAL_CHAT_URL", "http://127.0.0.1:8000/chat/internal/voice")

def tts_to_base64(text: str) -> Optional[str]:
    """
    Convert text -> base64 mp3 directly in memory.
    """
    if not text or not text.strip():
        return None
    try:
        return text_to_speech_base64(Config.TTS_MODEL, get_tts_api_key(), text)
    except Exception as e:
        logging.warning(f"TTS failed: {e}")
        return None

def get_answer_from_backend(user_input: str, history: List[Dict[str, str]]) -> str:
    payload = {
        "question": user_input,
        "history": history
    }
    try:
        resp = requests.post(BACKEND_INTERNAL_CHAT_URL, json=payload, timeout=30.0)
        resp.raise_for_status()
        data = resp.json()
        return data.get("answer", "Xin lỗi, tôi không thể trả lời lúc này.")
    except Exception as e:
        logging.warning(f"Backend call failed: {e}")
        return "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau."

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Config.validate_config()
    logging.info("WS server (Gateway mode) startup done.")

@app.get("/health")
def health():
    return {"ok": True}

@app.websocket("/ws-call")
async def ws_call(ws: WebSocket):
    await ws.accept()
    # History includes only user and assistant messages for backend
    chat_history: List[Dict[str, str]] = []

    async def send_welcome():
        await asyncio.sleep(0.5) 
        tts_b64 = await asyncio.to_thread(tts_to_base64, WELCOME_PROMPT)
        await ws.send_text(json.dumps({
            "type": "answer",  
            "text": WELCOME_PROMPT, 
            "audio_b64": tts_b64
        }, ensure_ascii=False))

    asyncio.create_task(send_welcome())
    
    try:
        while True:
            try:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=40.0)
            except asyncio.TimeoutError:
                prompt_msg = "Tôi có thể hỗ trợ gì cho bạn?"
                tts_b64 = await asyncio.to_thread(tts_to_base64, prompt_msg)
                await ws.send_text(json.dumps({
                    "type": "answer", 
                    "text": prompt_msg, 
                    "audio_b64": tts_b64
                }, ensure_ascii=False))
                continue

            try:
                payload = json.loads(raw)
            except Exception:
                await ws.send_text(json.dumps({"type": "error", "message": "Invalid JSON"}, ensure_ascii=False))
                continue
                
            msg_type = payload.get("type")
            if msg_type == "hello":
                continue

            if msg_type != "text":
                await ws.send_text(json.dumps({"type": "error", "message": "Unsupported type"}, ensure_ascii=False))
                continue

            user_text = (payload.get("text") or "").strip()
            want_tts = bool(payload.get("tts", False))

            if len(user_text) < 2:
                continue

            if any(x in user_text.lower() for x in ["bye", "goodbye", "exit"]):
                await ws.send_text(json.dumps({"type": "answer", "text": "Tạm biệt bạn!", "audio_b64": None}, ensure_ascii=False))
                await ws.close()
                return

            try:
                answer = await asyncio.to_thread(get_answer_from_backend, user_text, chat_history)
                audio_b64 = await asyncio.to_thread(tts_to_base64, answer) if want_tts else None
                
                # Append to history
                chat_history.append({"role": "user", "content": user_text})
                chat_history.append({"role": "assistant", "content": answer})
                
                # Keep history short (last 6 turns)
                if len(chat_history) > 12:
                    chat_history = chat_history[-12:]

                await ws.send_text(
                    json.dumps(
                        {"type": "answer", "text": answer, "audio_b64": audio_b64},
                        ensure_ascii=False,
                    )
                )
            except Exception as e:
                logging.exception("Error while answering")
                await ws.send_text(json.dumps({"type": "error", "message": str(e)}, ensure_ascii=False))

    except WebSocketDisconnect:
        logging.info("Client disconnected")
    except Exception as e:
        logging.exception("WS fatal error")
        try:
            await ws.send_text(json.dumps({"type": "error", "message": str(e)}, ensure_ascii=False))
        except Exception:
            pass
