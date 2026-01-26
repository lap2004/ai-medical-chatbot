# # app/services/stt_service.py
# from __future__ import annotations

# import os
# import shutil
# import subprocess
# import uuid
# from functools import lru_cache
# from pathlib import Path
# from typing import Optional, Tuple

# from faster_whisper import WhisperModel

# from app.config import settings


# # =========================
# # Config & paths
# # =========================
# AUDIO_TMP_DIR = Path(settings.audio_tmp_dir or "data/uploads").resolve()
# AUDIO_TMP_DIR.mkdir(parents=True, exist_ok=True)

# STT_MODEL_SIZE = settings.stt_model_size or os.getenv("STT_MODEL_SIZE", "base")  # tiny/base/small/medium/large-v3
# STT_DEVICE = settings.stt_device or os.getenv("STT_DEVICE", "auto")              # "cuda" | "cpu" | "auto"
# STT_COMPUTE = settings.stt_compute or os.getenv("STT_COMPUTE", "auto")           # "float16" | "int8" | "int8_float16" | "int8_bfloat16" | "auto"
# DEFAULT_STT_LANGUAGE = (settings.stt_language or "vi-VN").split("-")[0]          # "vi-VN" -> "vi"


# # =========================
# # Helpers
# # =========================
# def _decide_device_and_compute() -> Tuple[str, str]:
#     """
#     Chọn device / compute type hợp lý.
#     - "auto": nếu có CUDA (dựa trên CUDA_VISIBLE_DEVICES) thì dùng cuda + float16, ngược lại cpu + int8.
#     """
#     if (settings.stt_device or STT_DEVICE) == "auto":
#         use_cuda = os.getenv("CUDA_VISIBLE_DEVICES", "") not in ("", "-1")
#         device = "cuda" if use_cuda else "cpu"
#     else:
#         device = settings.stt_device or STT_DEVICE

#     if (settings.stt_compute or STT_COMPUTE) == "auto":
#         compute = "float16" if device == "cuda" else "int8"
#     else:
#         compute = settings.stt_compute or STT_COMPUTE

#     return device, compute


# @lru_cache(maxsize=1)
# def _load_model() -> WhisperModel:
#     """
#     Tải model faster-whisper và cache toàn process.
#     """
#     device, compute = _decide_device_and_compute()
#     # Bạn có thể thêm download_root="data/models" để cache model local
#     return WhisperModel(
#         STT_MODEL_SIZE,
#         device=device,
#         compute_type=compute,
#         # download_root="data/models",
#     )


# def _resolve_ffmpeg() -> str:
#     """
#     Tìm ffmpeg executable theo thứ tự:
#     1) settings.ffmpeg_bin (đặt trong .env: FFMPEG_BIN=C:\ffmpeg\bin\ffmpeg.exe)
#     2) which("ffmpeg") trong PATH hiện tại của tiến trình
#     3) raise lỗi hướng dẫn cài đặt
#     """
#     # 1) Ưu tiên biến môi trường cấu hình
#     if getattr(settings, "ffmpeg_bin", ""):
#         p = Path(settings.ffmpeg_bin)
#         if p.exists():
#             return str(p)

#     # 2) PATH hiện tại của tiến trình (lưu ý: tiến trình uvicorn có thể khác shell bạn vừa kiểm tra)
#     found = shutil.which("ffmpeg")
#     if found:
#         return found

#     # 3) Hướng dẫn lỗi rõ ràng (đặc biệt cho Windows)
#     raise RuntimeError(
#         "ffmpeg not found. "
#         "Hãy cài ffmpeg và thêm vào PATH, hoặc đặt biến .env FFMPEG_BIN=C:\\ffmpeg\\bin\\ffmpeg.exe "
#         "rồi khởi động lại server."
#     )


# def _ensure_wav_16k_mono(src_path: Path) -> Path:
#     """
#     Chuẩn hoá input audio về WAV 16kHz mono bằng ffmpeg.
#     (mp3/m4a/webm/ogg/… đều cần ffmpeg để decode ổn định)
#     """
#     if not src_path.exists():
#         raise FileNotFoundError(f"Audio file not found: {src_path}")

#     ffmpeg = _resolve_ffmpeg()
#     dst_path = AUDIO_TMP_DIR / f"norm_{uuid.uuid4().hex}.wav"

#     cmd = [
#         ffmpeg,
#         "-hide_banner",
#         "-loglevel", "error",
#         "-i", str(src_path),
#         "-ac", "1",               # mono
#         "-ar", "16000",           # 16 kHz
#         str(dst_path),
#         "-y",                     # overwrite
#     ]
#     try:
#         # Lưu ý Windows: KHÔNG cần shell=True khi đã có đường dẫn tuyệt đối
#         subprocess.run(cmd, check=True)
#     except Exception as e:
#         raise RuntimeError(f"ffmpeg failed to convert audio: {e}")

#     return dst_path


# # =========================
# # Public API
# # =========================
# def transcribe_audio(
#     file_path: str,
#     language: Optional[str] = None,
#     vad_filter: bool = True,
#     beam_size: int = 5,
#     best_of: int = 5,
# ) -> str:
#     """
#     Chuyển giọng nói -> text bằng faster-whisper.
#     - file_path: đường dẫn file gốc (mp3, m4a, wav, webm, ogg…)
#     - language: mã ngôn ngữ (vd 'vi', 'en'). None = auto-detect. Nếu bạn truyền 'vi-VN' sẽ giữ phần 'vi'.
#     - vad_filter: bật VAD để bỏ đoạn im lặng/tiếng ồn khi file dài.
#     - beam_size/best_of: tăng nhẹ độ chính xác (đổi lại tốc độ).
#     Trả về: transcript string.
#     """
#     src = Path(file_path)
#     if not src.exists():
#         raise FileNotFoundError(f"Audio file not found: {file_path}")

#     # Chuẩn hoá về WAV 16k mono để ASR ổn định nhất
#     wav = _ensure_wav_16k_mono(src)

#     # Xác định ngôn ngữ cho Whisper (nếu 'vi-VN' -> 'vi')
#     lang = (language or DEFAULT_STT_LANGUAGE or "vi").split("-")[0]

#     model = _load_model()
#     segments, info = model.transcribe(
#         str(wav),
#         language=lang if language else None,   # None để auto-detect khi người dùng không truyền
#         vad_filter=vad_filter,
#         beam_size=beam_size,
#         best_of=best_of,
#         # word_timestamps=False,
#     )

#     # Ghép text các segment
#     texts = []
#     for seg in segments:
#         if seg.text:
#             texts.append(seg.text.strip())

#     transcript = " ".join(t for t in texts if t).strip()

#     # Xoá file chuẩn hoá (tạm)
#     try:
#         wav.unlink(missing_ok=True)
#     except Exception:
#         pass

#     return transcript

# app/services/stt_service.py
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


# =========================
# Config & paths
# =========================
AUDIO_TMP_DIR = Path(settings.audio_tmp_dir or "data/uploads").resolve()
AUDIO_TMP_DIR.mkdir(parents=True, exist_ok=True)

STT_MODEL_SIZE = settings.stt_model_size or os.getenv("STT_MODEL_SIZE", "base")
STT_DEVICE = settings.stt_device or os.getenv("STT_DEVICE", "auto")
STT_COMPUTE = settings.stt_compute or os.getenv("STT_COMPUTE", "auto")
DEFAULT_STT_LANGUAGE = (settings.stt_language or "vi-VN").split("-")[0]  # vi


# =========================
# Helpers
# =========================
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
        # download_root="data/models",
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


# =========================
# Public API (Batch)
# =========================
def transcribe_audio(
    file_path: str,
    language: Optional[str] = None,
    vad_filter: bool = True,
    beam_size: int = 5,
    best_of: int = 5,
) -> str:
    """
    Batch STT: file -> wav16k mono -> Whisper -> transcript
    """
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
    """
    Tách riêng để tái dùng: wav path -> transcript
    """
    model = _load_model()
    lang = _normalize_language(language)

    segments, info = model.transcribe(
        wav_path,
        language=lang,                # None => auto-detect
        vad_filter=vad_filter,
        beam_size=beam_size,
        best_of=best_of,
    )
    return _segments_to_text(segments)


# =========================
# Realtime helpers
# =========================
def transcribe_array(
    audio_f32: np.ndarray,
    sample_rate: int = 16000,
    language: Optional[str] = None,
    vad_filter: bool = True,
    beam_size: int = 1,
    best_of: int = 1,
) -> str:
    """
    Realtime-friendly:
    - audio_f32: np.float32 1D array [-1, 1], mono
    - sample_rate: khuyến nghị 16000
    """
    if audio_f32 is None or audio_f32.size == 0:
        return ""

    model = _load_model()
    lang = _normalize_language(language)

    # faster-whisper có thể nhận ndarray trực tiếp
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
    """
    Realtime-friendly:
    - pcm16_bytes: raw PCM16 mono (little-endian)
    - Convert -> float32 [-1,1] -> transcribe_array
    """
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
