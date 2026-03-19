import json
import re
from typing import List, Dict, Any
import google.generativeai as genai
from loguru import logger
from app.config import settings

SYSTEM_INSTRUCTIONS = """
Bạn là **AI Bác sĩ trợ lý sức khỏe tổng quát**.

Vai trò của bạn là:
- Giải thích kiến thức về **triệu chứng, bệnh lý, chăm sóc sức khỏe và lối sống lành mạnh**
- Giúp người dùng **hiểu tình trạng của mình và định hướng khi nào nên đi khám**
- KHÔNG chẩn đoán xác định
- KHÔNG kê đơn thuốc

⚕️ NGUYÊN TẮC AN TOÀN & ĐẠO ĐỨC Y KHOA (BẮT BUỘC)
1. **Không chẩn đoán bệnh hoặc kê đơn.**
   - Chỉ cung cấp thông tin giáo dục và lời khuyên an toàn.
   - Nếu cần, hãy khuyến nghị người dùng gặp bác sĩ/chuyên gia y tế.

2. **Nhận diện tình huống nguy hiểm / cấp cứu.**
   Nếu người dùng mô tả các dấu hiệu như:
   - Đau ngực dữ dội, khó thở
   - Yếu liệt, méo miệng, mất ý thức
   - Chảy máu nhiều, đau bụng dữ dội
   - Ý định tự tử hoặc hành vi tự hại

   → PHẢI nói rõ ràng và trực tiếp:
   **"Hãy gọi cấp cứu 115 hoặc đến bệnh viện gần nhất ngay lập tức."**

3. **Thiếu thông tin thì hỏi thêm – nhưng tối đa 3 câu.**
   Ví dụ:
   - Triệu chứng bắt đầu từ khi nào?
   - Có bệnh nền hoặc đang dùng thuốc gì không?
   - Mức độ nặng có tăng lên không?

4. **Ngôn ngữ bắt buộc:**
   - Nhẹ nhàng
   - Dễ hiểu
   - Trấn an
   - Chuyên nghiệp
   - Không gây hoang mang
   
5. **Quy tắc ngôn ngữ (Language Consistency):**
    - Nếu người dùng hỏi bằng tiếng Việt, phải phản hồi hoàn toàn bằng tiếng Việt.
    - Nếu người dùng hỏi bằng tiếng Anh, phải phản hồi hoàn toàn bằng tiếng Anh.
    - Sử dụng thuật ngữ y khoa chính xác nhưng dễ hiểu trong cả hai ngôn ngữ.

💬 XỬ LÝ CÁC TRƯỜNG HỢP ĐẶC BIỆT
A. **Nếu người dùng chỉ chào hỏi / cảm ơn / tạm biệt**
   (ví dụ: "hi", "chào", "ok", "thanks", "bye", "?")

   → Trả lời thân thiện, ngắn gọn, đúng vai trò bác sĩ AI.
   → KHÔNG yêu cầu thêm thông tin y tế.

B. **Nếu câu hỏi không liên quan đến y tế**
   (ví dụ: công nghệ, thời tiết, chính trị…)

   → Trả lời ngắn gọn rằng:
   bạn **chỉ hỗ trợ về sức khỏe & y học**,
   và mời người dùng đặt câu hỏi phù hợp.

C. **Nếu câu hỏi quá ngắn hoặc mơ hồ**
   → Trả lời lịch sự và gợi ý người dùng mô tả rõ hơn.

📘 SỬ DỤNG NGỮ CẢNH (CONTEXT)
- Chỉ sử dụng thông tin có trong CONTEXT được cung cấp.
- KHÔNG bịa thêm kiến thức ngoài context.
- Nếu context không đủ:
  → nói rõ: *"Tôi chưa chắc chắn, bạn nên tham khảo ý kiến bác sĩ."*
- Nếu nhiều context trùng lặp:
  → tổng hợp, không lặp ý.

📋 ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC – TUYỆT ĐỐI TUÂN THỦ)
Luôn trả về **MỘT JSON HỢP LỆ DUY NHẤT**, không in thêm bất kỳ chữ nào ngoài JSON.
TUYỆT ĐỐI KHÔNG dùng dấu sao (*), dấu thăng (#), hoặc gạch đầu dòng (-) để trình bày.

Schema:
{
  "answer": "Nội dung trả lời rõ ràng, thân thiện, an toàn",
  "reasoning_brief": "Tóm tắt ngắn gọn lý do hoặc logic",
  "references": ["nguồn hoặc tên bệnh từ context nếu có"],
  "safety": {
    "urgency": "emergency | urgent | routine",
    "rationale": "Giải thích mức độ nguy cấp"
  }
}
"""
RESPONSE_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "answer": {"type": "string"},
        "reasoning_brief": {"type": "string"},
        "references": {"type": "array", "items": {"type": "string"}},
        "safety": {
            "type": "object",
            "properties": {
                "urgency": {"type": "string", "enum": ["emergency", "urgent", "routine"]},
                "rationale": {"type": "string"}
            },
            "required": ["urgency", "rationale"]
        }
    },
    "required": ["answer", "safety"]
}

def _format_prompt(question: str, contexts: List[Dict[str, Any]], history: List[Dict[str, Any]] = None) -> str:
    ctx_block = "\n\n".join([
        f"[CTX {i+1}]\n{c['text']}\n(source: {c['doc_id']}#{c['chunk_id']})"
        for i, c in enumerate(contexts)
    ]) or "(không có ngữ cảnh)"
    
    history_block = ""
    if history:
        history_text = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in history])
        history_block = f"LỊCH SỬ CHAT (ĐỂ THAM KHẢO NGỮ CẢNH):\n{history_text}\n\n"

    return (
        "SYSTEM\n"
        f"{SYSTEM_INSTRUCTIONS}\n\n"
        "JSON_SCHEMA\n"
        f"{json.dumps(RESPONSE_JSON_SCHEMA, ensure_ascii=False)}\n\n"
        f"{history_block}"
        "CONTEXT (trích dẫn theo từng đoạn):\n"
        f"{ctx_block}\n\n"
        "USER QUESTION:\n"
        f"{question}\n\n"
        "Hãy trả lời BẰNG JSON DUY NHẤT theo JSON_SCHEMA ở trên."
    )

def call_gemini(prompt: str) -> str:
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY không có; trả dummy JSON.")
        return json.dumps({
            "answer": "Xin chào! Hiện chưa cấu hình GEMINI_API_KEY.",
            "reasoning_brief": "Dummy output due to missing API key.",
            "references": [],
            "safety": {"urgency": "routine", "rationale": "No LLM call."}
        }, ensure_ascii=False)

    genai.configure(api_key=settings.gemini_api_key)
    model_name = settings.gemini_model or "models/gemini-2.5-flash"
    model = genai.GenerativeModel(model_name)
    resp = model.generate_content(prompt)
    return resp.text or ""

def parse_json_safely(raw: str) -> Dict[str, Any]:
    raw = raw.strip()
    try:
        return json.loads(raw)
    except Exception:
        pass

    m = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass

    return {
        "answer": raw,
        "reasoning_brief": None,
        "references": [],
        "safety": {"urgency": "routine", "rationale": "LLM returned non-JSON"},
    }

def contextualize_query(question: str, history: List[Dict[str, Any]]) -> str:
    if not history:
        return question
        
    history_text = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in history])
    
    REWRITE_SYSTEM_PROMPT = """Bạn là một trợ lý ngôn ngữ AI.
Nhiệm vụ của bạn là xem xét LỊCH SỬ CHAT và CÂU HỎI MỚI của người dùng.
Nếu câu hỏi mới của người dùng có chứa các đại từ (ví dụ: nó, bác sĩ đó, thuốc này, triệu chứng này, bệnh đó...) hoặc bị thiếu ngữ cảnh,
hãy viết lại câu hỏi đó thành một câu hỏi ĐỘC LẬP (Standalone Query) có đầy đủ ý nghĩa, thay thế các đại từ bằng thực thể cụ thể từ lịch sử chat.
Nếu câu hỏi mới đã đầy đủ ý nghĩa hoặc không liên quan đến lịch sử chat, hãy giữ nguyên câu hỏi gốc.
Tuyệt đối KHÔNG trả lời câu hỏi, CHỈ trả về câu hỏi đã được viết lại. KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI CÂU HỎI.
"""

    prompt = (
        f"LỊCH SỬ CHAT:\n{history_text}\n\n"
        f"CÂU HỎI MỚI:\nUser: {question}\n\n"
        f"HƯỚNG DẪN:\n{REWRITE_SYSTEM_PROMPT}\n"
        f"-> CÂU HỎI ĐỘC LẬP:"
    )
    
    rewritten = call_gemini(prompt)
    if not rewritten.strip():
        return question
        
    clean_rewritten = rewritten.strip().strip('"').strip("'")
    logger.info(f"O-Query: {question} | Rewritten: {clean_rewritten}")
    return clean_rewritten

def build_answer(question: str, contexts: List[Dict[str, Any]], history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    prompt = _format_prompt(question, contexts, history)
    raw = call_gemini(prompt)
    parsed = parse_json_safely(raw)

    if "references" not in parsed:
        parsed["references"] = []
    if "safety" not in parsed:
        parsed["safety"] = {"urgency": "routine", "rationale": "missing field"}
    return parsed
