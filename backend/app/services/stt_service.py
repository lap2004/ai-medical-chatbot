from __future__ import annotations
import os
import shutil
import subprocess
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Optional, Tuple, Union, List
import numpy as np
from faster_whisper import WhisperModel
from app.config import settings

AUDIO_TMP_DIR = Path(settings.audio_tmp_dir or "data/uploads").resolve()
AUDIO_TMP_DIR.mkdir(parents=True, exist_ok=True)

STT_MODEL_SIZE = settings.stt_model_size or os.getenv("STT_MODEL_SIZE", "base")
STT_DEVICE = settings.stt_device or os.getenv("STT_DEVICE", "auto")
STT_COMPUTE = settings.stt_compute or os.getenv("STT_COMPUTE", "auto")
DEFAULT_STT_LANGUAGE = (settings.stt_language or "vi-VN").split("-")[0]  # vi

def _decide_device_and_compute() -> Tuple[str, str]:
    if (settings.stt_device or STT_DEVICE) == "auto":
        use_cuda = os.getenv("CUDA_VISIBLE_DEVICES", "") not in ("", "-1")
        device = "cuda" if use_cuda else "cpu"
    else:
        device = settings.stt_device or STT_DEVICE

    if (settings.stt_compute or STT_COMPUTE) == "auto":
        compute = "float16" if device == "cuda" else "int8"
    else:
        compute = settings.stt_compute or STT_COMPUTE

    return device, compute

@lru_cache(maxsize=1)
def _load_model() -> WhisperModel:
    device, compute = _decide_device_and_compute()
    return WhisperModel(
        STT_MODEL_SIZE,
        device=device,
        compute_type=compute,
    )

def _resolve_ffmpeg() -> str:
    if getattr(settings, "ffmpeg_bin", ""):
        p = Path(settings.ffmpeg_bin)
        if p.exists():
            return str(p)

    found = shutil.which("ffmpeg")
    if found:
        return found

    raise RuntimeError(
        "ffmpeg not found. "
        "Cài ffmpeg và thêm PATH hoặc đặt .env FFMPEG_BIN=C:\\ffmpeg\\bin\\ffmpeg.exe rồi restart."
    )

def _ensure_wav_16k_mono(src_path: Path) -> Path:
    if not src_path.exists():
        raise FileNotFoundError(f"Audio file not found: {src_path}")

    ffmpeg = _resolve_ffmpeg()
    dst_path = AUDIO_TMP_DIR / f"norm_{uuid.uuid4().hex}.wav"

    cmd = [
        ffmpeg,
        "-hide_banner",
        "-loglevel", "error",
        "-i", str(src_path),
        "-ac", "1",
        "-ar", "16000",
        str(dst_path),
        "-y",
    ]
    subprocess.run(cmd, check=True)
    return dst_path

def _normalize_language(language: Optional[str]) -> Optional[str]:
    """
    - None => để Whisper auto-detect (nếu caller không truyền)
    - 'vi-VN' => 'vi'
    - '' => None
    """
    if language is None:
        return None
    language = (language or "").strip()
    if not language:
        return None
    return language.split("-")[0].lower()


def _segments_to_text(segments) -> str:
    texts: List[str] = []
    for seg in segments:
        if getattr(seg, "text", None):
            t = seg.text.strip()
            if t:
                texts.append(t)
    return " ".join(texts).strip()

def transcribe_audio(
    file_path: str,
    language: Optional[str] = None,
    vad_filter: bool = True,
    beam_size: int = 5,
    best_of: int = 5,
) -> str:
    src = Path(file_path)
    if not src.exists():
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    wav = _ensure_wav_16k_mono(src)
    try:
        return transcribe_wav_path(
            str(wav),
            language=language,
            vad_filter=vad_filter,
            beam_size=beam_size,
            best_of=best_of,
        )
    finally:
        try:
            wav.unlink(missing_ok=True)
        except Exception:
            pass

def transcribe_wav_path(
    wav_path: str,
    language: Optional[str] = None,
    vad_filter: bool = True,
    beam_size: int = 5,
    best_of: int = 5,
) -> str:
    model = _load_model()
    lang = _normalize_language(language)

    segments, info = model.transcribe(
        wav_path,
        language=lang,               
        vad_filter=vad_filter,
        beam_size=beam_size,
        best_of=best_of,
    )
    return _segments_to_text(segments)

def transcribe_array(
    audio_f32: np.ndarray,
    sample_rate: int = 16000,
    language: Optional[str] = None,
    vad_filter: bool = True,
    beam_size: int = 1,
    best_of: int = 1,
) -> str:
    if audio_f32 is None or audio_f32.size == 0:
        return ""

    model = _load_model()
    lang = _normalize_language(language)

    segments, info = model.transcribe(
        audio_f32,
        language=lang,
        vad_filter=vad_filter,
        beam_size=beam_size,
        best_of=best_of,
    )
    return _segments_to_text(segments)


def transcribe_pcm16(
    pcm16_bytes: bytes,
    sample_rate: int = 16000,
    language: Optional[str] = None,
    vad_filter: bool = True,
) -> str:
    if not pcm16_bytes:
        return ""

    audio_i16 = np.frombuffer(pcm16_bytes, dtype=np.int16)
    if audio_i16.size == 0:
        return ""

    audio_f32 = audio_i16.astype(np.float32) / 32768.0
    return transcribe_array(
        audio_f32=audio_f32,
        sample_rate=sample_rate,
        language=language,
        vad_filter=vad_filter,
        beam_size=1,
        best_of=1,
    )
