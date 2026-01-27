# app/services/tts_service.py
from __future__ import annotations

from pathlib import Path
import uuid

from gtts import gTTS

# Thư mục mặc định lưu audio
DEFAULT_OUT_DIR = Path("data/audio")


def synthesize_speech(
    text: str,
    out_dir: str | Path = DEFAULT_OUT_DIR,
    lang: str = "vi",
) -> str:
    """
    Text-to-Speech (gTTS)

    ✅ 1 text -> 1 file mp3 DUY NHẤT
    ❌ Không chia segment
    ❌ Không realtime
    ❌ Không sinh nhiều file

    Trả về:
        đường dẫn tuyệt đối tới file mp3
    """
    text = (text or "").strip()
    if not text:
        raise ValueError("TTS text is empty")

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    filename = f"tts_{uuid.uuid4().hex}.mp3"
    file_path = out_path / filename

    # gTTS chạy 1 lần cho toàn bộ text
    tts = gTTS(text=text, lang=lang)
    tts.save(str(file_path))

    return str(file_path)
