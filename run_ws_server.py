import os
import json
import uuid
import base64
import logging
import asyncio
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from voice_assistant.config import Config
from voice_assistant.api_key_manager import (
    get_response_api_key,
    get_tts_api_key,
)
from voice_assistant.rag_retriever import RAGRetriever
from voice_assistant.response_generation import generate_response
from voice_assistant.text_to_speech import text_to_speech

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

WELCOME_PROMPT = "Xin chào, tôi là trợ lý sức khỏe AI. Tôi có thể giúp gì cho bạn?"

SYSTEM_BASE = (
    "You are Verbi, a medical voice assistant.\n"
    "Do NOT diagnose.\n"
    "Do NOT prescribe medication.\n"
    "If information is insufficient, say you do not know."
)

def normalize_voice_query(text: str) -> str:
    noise = [
        "ờ", "à", "ừm", "ờm",
        "cho tôi hỏi", "tôi muốn hỏi",
        "bác sĩ ơi", "cho em hỏi",
    ]
    t = (text or "").lower()
    for n in noise:
        t = t.replace(n, "")
    return t.strip()

def tts_to_base64_mp3(text: str) -> Optional[str]:
    """
    Convert text -> mp3 bytes -> base64 string.
    Returns None if TTS fails or text empty.
    """
    if not text or not text.strip():
        return None

    # tạo file tạm mp3
    tmp_name = f"ws_tts_{uuid.uuid4().hex}.mp3"
    tmp_path = os.path.join(os.getcwd(), tmp_name)

    try:
        text_to_speech(Config.TTS_MODEL, get_tts_api_key(), text, tmp_path)
        with open(tmp_path, "rb") as f:
            b = f.read()
        return base64.b64encode(b).decode("utf-8")
    except Exception as e:
        logging.warning(f"TTS failed: {e}")
        return None
    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass

def rewrite_query_standalone(user_input: str, history: List[Dict[str, str]]) -> str:
    """
    Sử dụng LLM để viết lại câu hỏi (standalone query) dưa vào ngữ cảnh lịch sử.
    Mục đích: Khử các đại từ (nó, cái đó, ông ấy...) thành thực thể cụ thể để RAG search chính xác.
    """
    # Lọc bỏ system prompt, chỉ lấy các lượt hội thoại
    user_assistant_hist = [m for m in history if m["role"] != "system"]
    
    # Nếu không có lịch sử (câu đầu tiên), trả về nguyên bản
    if not user_assistant_hist:
        return user_input
        
    # Tạo nội dung lịch sử
    hist_str = ""
    for msg in user_assistant_hist:
        role_name = "User" if msg["role"] == "user" else "AI"
        hist_str += f"{role_name}: {msg['content']}\n"
        
    prompt = f"""
    Dưới đây là lịch sử trò chuyện ngắn gọn:
    {hist_str}
    
    Dựa vào ngữ cảnh trên, hãy viết lại câu hỏi hiện tại của User thành một câu hỏi "ĐỘC LẬP" và CỤ THỂ, mang đầy đủ ý nghĩa (thay thế các đại từ "nó", "bệnh này", "triệu chứng đó"...) để có thể dùng tìm kiếm tài liệu Y tế hiệu quả.
    CHỈ TRẢ VỀ CÂU HỎI ĐÃ VIẾT LẠI, KHÔNG GIẢI THÍCH THÊM.
    
    Câu hỏi hiện tại của User: "{user_input}"
    """
    
    try:
        rewritten_reply = generate_response(
            Config.RESPONSE_MODEL,
            get_response_api_key(),
            [{"role": "user", "content": prompt.strip()}]
        )
        # Loại bỏ ngoặc kép dư thừa nếu LLM lỡ sinh ra
        return rewritten_reply.strip(' "')
    except Exception as e:
        logging.warning(f"Failed to rewrite query: {e}")
        return user_input

def build_medical_answer(user_input: str, rag: RAGRetriever, chat_history: List[Dict[str, str]]) -> str:
    # 1. Sliding Window k=3
    # Mặc định chat_history luôn có 1 câu system ở đầu.
    # Nên danh sách sẽ là [system, (user, assistant), (user, assistant)...]
    # k=3 => giữ tối đa 3 cặp (user, assistant) gần nhất = 6 messages + 1 system
    max_history_len = 1 + (3 * 2) 
    
    # 2. Rewrite Query base on history BEFORE adding new user_input
    standalone_query = rewrite_query_standalone(user_input, chat_history)
    logging.info(f"Original Query: {user_input}")
    logging.info(f"Standalone Query: {standalone_query}")
    
    # 3. RAG Retrieval sử dụng standalone_query
    clean_query = normalize_voice_query(standalone_query)
    rag_results = rag.retrieve(clean_query)
    
    if not rag_results:
        response_text = (
            "Tôi không có đủ thông tin y tế đáng tin cậy để trả lời câu hỏi này. "
            "Bạn nên tham khảo ý kiến bác sĩ."
        )
        chat_history.append({"role": "user", "content": user_input})
        chat_history.append({"role": "assistant", "content": response_text})
        
        # Lọc cửa sổ trượt
        if len(chat_history) > max_history_len:
            # Xoá cặp (user, assistant) cũ nhất ở vị trí index 1 và 2 (sau system)
            chat_history.pop(1)
            chat_history.pop(1)
            
        return response_text

    context = "\n\n---\n\n".join(r["content"] for r in rag_results)

    # 4. Tạo message gửi đi LLM chính
    # Lưu ý: Lúc này đưa raw "user_input" vào để LLM trả lời tự nhiên theo đúng câu hỏi User hỏi
    # nhưng "context" thì đã được search mạnh mẽ bằng "standalone_query"
    messages = chat_history + [
        {
            "role": "system",
            "content": (
                "CHỈ sử dụng MEDICAL CONTEXT dưới đây.\n"
                "Không chẩn đoán. Không kê đơn.\n\n"
                f"MEDICAL CONTEXT:\n{context}"
            ),
        },
        {"role": "user", "content": user_input},
    ]

    response_text = generate_response(
        Config.RESPONSE_MODEL,
        get_response_api_key(),
        messages,
    )

    # 5. Lưu lại lịch sử gốc của user
    chat_history.append({"role": "user", "content": user_input})
    chat_history.append({"role": "assistant", "content": response_text})
    
    # Lọc cửa sổ trượt
    if len(chat_history) > max_history_len:
        # Xoá cặp (user, assistant) cũ nhất ở vị trí index 1 và 2 (sau system)
        chat_history.pop(1)
        chat_history.pop(1)

    return response_text


app = FastAPI()

# Cloudflared/public origin => dễ nhất là allow all khi demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton RAG
rag: Optional[RAGRetriever] = None

@app.on_event("startup")
def on_startup():
    global rag
    Config.validate_config()

    rag = RAGRetriever(top_k=3, min_score=0.35)

    try:
        if hasattr(rag, "warmup"):
            rag.warmup()
        else:
            rag.retrieve("warmup")
    except Exception as e:
        logging.warning(f"RAG warmup failed: {e}")

    logging.info("WS server startup done.")


@app.get("/health")
def health():
    return {"ok": True}


@app.websocket("/ws-call")
async def ws_call(ws: WebSocket):
    """
    Protocol (JSON):
    Client -> Server:
      {"type":"hello"} (optional)
      {"type":"text","text":"...","tts":true|false}

    Server -> Client:
      {"type":"welcome","text":"..."}
      {"type":"answer","text":"...","audio_b64": "...optional..." }
      {"type":"error","message":"..."}
    """
    await ws.accept()

    chat_history: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_BASE}]

    # Gửi welcome khởi điểm với TTS
    async def send_welcome():
        await asyncio.sleep(0.5) 
        tts_b64 = await asyncio.to_thread(tts_to_base64_mp3, WELCOME_PROMPT)
        await ws.send_text(json.dumps({
            "type": "answer",  # Giữ type là answer để trên Frontend tự gọi được loop phát nhạc
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
                tts_b64 = await asyncio.to_thread(tts_to_base64_mp3, prompt_msg)
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
                # client hello => just ignore if we already sent welcome
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

            if rag is None:
                await ws.send_text(json.dumps({"type": "error", "message": "RAG not initialized"}, ensure_ascii=False))
                continue

            try:
                answer = await asyncio.to_thread(build_medical_answer, user_text, rag, chat_history)
                audio_b64 = await asyncio.to_thread(tts_to_base64_mp3, answer) if want_tts else None

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
