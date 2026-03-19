from __future__ import annotations
from pathlib import Path
import uuid
from gtts import gTTS

DEFAULT_OUT_DIR = Path("data/audio")

def synthesize_speech(
    text: str,
    out_dir: str | Path = DEFAULT_OUT_DIR,
    lang: str = "vi",
) -> str:
    text = (text or "").strip()
    if not text:
        raise ValueError("TTS text is empty")

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    filename = f"tts_{uuid.uuid4().hex}.mp3"
    file_path = out_path / filename
    tts = gTTS(text=text, lang=lang)
    tts.save(str(file_path))

    return str(file_path)
