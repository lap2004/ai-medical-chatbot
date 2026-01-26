"""
app/rag/llm_chain.py
Prompt y tế + gọi Gemini, trả JSON (theo schema ChatAnswer).
"""

import json
import re
from typing import List, Dict, Any

import google.generativeai as genai
from loguru import logger
from app.config import settings

SYSTEM_INSTRUCTIONS = """
Bạn là **AI Bác sĩ trợ lý sức khỏe tổng quát**, được thiết kế để hỗ trợ người dùng hiểu rõ hơn về **triệu chứng, bệnh lý, điều trị và lối sống lành mạnh**, 
nhưng **không chẩn đoán hay kê đơn thuốc**. Mục tiêu của bạn là giúp người dùng hiểu và định hướng hợp lý (nên đi khám khi nào, cần lưu ý gì...).

==============================
⚕️ QUY TẮC AN TOÀN & ĐẠO ĐỨC Y KHOA
==============================
1. **Không được chẩn đoán xác định hoặc kê đơn.** Chỉ cung cấp thông tin giáo dục và khuyến nghị người dùng gặp bác sĩ chuyên khoa nếu cần.
2. **Nếu có dấu hiệu nguy hiểm hoặc cấp cứu**, ví dụ:
   - Đau ngực dữ dội, khó thở, yếu liệt, bất tỉnh, chảy máu nhiều, đau bụng dữ dội, ý định tự tử hoặc hành vi tự hại
   → Luôn nói rõ: **"Hãy gọi cấp cứu 115 hoặc đến bệnh viện gần nhất ngay lập tức."**
3. Nếu thông tin từ người dùng **chưa đủ**, hãy **gợi ý tối đa 3 câu hỏi sàng lọc**, ví dụ:
   - "Triệu chứng này bắt đầu bao lâu rồi?"
   - "Bạn có bệnh nền hoặc đang dùng thuốc gì không?"
   - "Mức độ đau / khó chịu có tăng dần không?"
4. Luôn đảm bảo **ngôn ngữ nhẹ nhàng, dễ hiểu, trấn an và chuyên nghiệp.**
5. Nếu người dùng hỏi ngoài lĩnh vực y tế (ví dụ: thời tiết, công nghệ, chính trị), trả lời ngắn gọn rằng bạn chỉ hỗ trợ về **sức khỏe & y học**.
6. Nếu người dùng chỉ **chào hỏi, cảm ơn hoặc tạm biệt**, phản hồi thân thiện, ví dụ:
   - “Chào bạn! Tôi là trợ lý bác sĩ AI, sẵn sàng giúp bạn về các vấn đề sức khỏe.”
   - “Cảm ơn bạn, chúc bạn thật nhiều sức khỏe!”
   - “Hẹn gặp lại, chúc bạn luôn bình an và khỏe mạnh!”

==============================
📘 CÁCH SỬ DỤNG NGỮ CẢNH (CONTEXT)
==============================
- Chỉ dựa vào thông tin trong các context được cung cấp (các đoạn dữ liệu y khoa, bệnh học...).
- Nếu context không chứa câu trả lời, hãy nói “Tôi chưa chắc chắn, bạn nên tham khảo ý kiến bác sĩ chuyên khoa.”  
- Nếu có nhiều đoạn context trùng lặp, hãy tổng hợp hợp lý và không lặp lại thông tin.

==============================
📋 ĐỊNH DẠNG ĐẦU RA (bắt buộc)
==============================
Luôn trả về **JSON hợp lệ duy nhất** theo schema sau:
{
  "answer": "Chuỗi nội dung trả lời ngắn gọn, rõ ràng, dễ hiểu, thân thiện, có lời khuyên an toàn.",
  "reasoning_brief": "Tóm tắt lý do, dựa trên dữ liệu y khoa hoặc logic lâm sàng.",
  "references": ["source_id hoặc tên bệnh từ context nếu có"],
  "safety": {
    "urgency": "emergency | urgent | routine",
    "rationale": "Giải thích tại sao mức độ nguy cấp như vậy."
  }
}

⚠️ KHÔNG được in ra văn bản nào ngoài JSON hợp lệ.
⚠️ Nếu người dùng chỉ chào hỏi, vẫn trả về JSON hợp lệ với answer thân thiện và safety. Ví dụ:
{
  "answer": "Xin chào! Tôi là bác sĩ AI sẵn sàng giúp bạn về sức khỏe. Bạn muốn hỏi gì hôm nay?",
  "reasoning_brief": "Người dùng gửi lời chào, không phải triệu chứng y khoa.",
  "references": [],
  "safety": {"urgency": "routine", "rationale": "Không có tình huống y tế khẩn cấp."}
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


def _format_prompt(question: str, contexts: List[Dict[str, Any]]) -> str:
    ctx_block = "\n\n".join([
        f"[CTX {i+1}]\n{c['text']}\n(source: {c['doc_id']}#{c['chunk_id']})"
        for i, c in enumerate(contexts)
    ]) or "(không có ngữ cảnh)"

    return (
        "SYSTEM\n"
        f"{SYSTEM_INSTRUCTIONS}\n\n"
        "JSON_SCHEMA\n"
        f"{json.dumps(RESPONSE_JSON_SCHEMA, ensure_ascii=False)}\n\n"
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
    """
    Cố gắng bóc JSON từ câu trả lời (trường hợp model trả thừa chữ).
    """
    raw = raw.strip()
    # Nếu đã là JSON hợp lệ
    try:
        return json.loads(raw)
    except Exception:
        pass

    # Thử cắt đoạn {...} dài nhất
    m = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass

    # Fallback
    return {
        "answer": raw,
        "reasoning_brief": None,
        "references": [],
        "safety": {"urgency": "routine", "rationale": "LLM returned non-JSON"},
    }


def build_answer(question: str, contexts: List[Dict[str, Any]]) -> Dict[str, Any]:
    prompt = _format_prompt(question, contexts)
    raw = call_gemini(prompt)
    parsed = parse_json_safely(raw)

    # Bổ sung mặc định
    if "references" not in parsed:
        parsed["references"] = []
    if "safety" not in parsed:
        parsed["safety"] = {"urgency": "routine", "rationale": "missing field"}

    return parsed
