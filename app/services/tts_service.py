
# # app/services/tts_service.py
# from __future__ import annotations

# from pathlib import Path
# from typing import List, Optional, Tuple
# import re
# import uuid

# from gtts import gTTS


# DEFAULT_OUT_DIR = Path("data/audio")


# def split_text_for_tts(text: str, max_chars: int = 180) -> List[str]:
#     """
#     Chia text thành các đoạn ngắn để phát gần realtime.
#     - Ưu tiên tách theo câu (., ?, !)
#     - Nếu câu quá dài -> cắt theo max_chars
#     """
#     text = (text or "").strip()
#     if not text:
#         return []

#     # Tách câu theo dấu câu
#     sentences = re.split(r"(?<=[\.\?\!。！？])\s+", text.replace("\n", " ").strip())
#     chunks: List[str] = []

#     for s in sentences:
#         s = s.strip()
#         if not s:
#             continue

#         if len(s) <= max_chars:
#             chunks.append(s)
#         else:
#             # Cắt thô theo max_chars nếu câu quá dài
#             start = 0
#             while start < len(s):
#                 part = s[start : start + max_chars].strip()
#                 if part:
#                     chunks.append(part)
#                 start += max_chars

#     # Gộp các câu ngắn lại cho tới max_chars để giảm số file mp3
#     merged: List[str] = []
#     buf = ""
#     for c in chunks:
#         if not buf:
#             buf = c
#             continue
#         if len(buf) + 1 + len(c) <= max_chars:
#             buf = f"{buf} {c}"
#         else:
#             merged.append(buf)
#             buf = c
#     if buf:
#         merged.append(buf)

#     return merged


# def synthesize_speech(
#     text: str,
#     out_dir: str = "data/audio",
#     lang: str = "vi",
#     max_chars: int = 180,
# ) -> str:
#     """
#     (Tương thích API cũ)
#     - Trả về 1 đường dẫn mp3.
#     - Với text dài: tạo N segment mp3 và GHÉP BẰNG CÁCH NỐI BYTE mp3 là KHÔNG CHUẨN.
#       => Bản mới: tạo 1 file duy nhất bằng cách synthesize toàn text nếu không quá dài.
#          Nếu quá dài: synthesize thành nhiều file và trả về file đầu tiên (khuyến nghị dùng realtime segments).
#     """
#     out_path = Path(out_dir)
#     out_path.mkdir(parents=True, exist_ok=True)

#     segments = split_text_for_tts(text, max_chars=max_chars)

#     # Nếu chỉ 1 đoạn => tạo 1 mp3
#     if len(segments) <= 1:
#         file_path = out_path / f"tts_{uuid.uuid4().hex}.mp3"
#         gTTS(text=segments[0] if segments else "", lang=lang).save(str(file_path))
#         return str(file_path)

#     # Nếu nhiều đoạn: KHÔNG ghép mp3 bằng nối byte (dễ lỗi header).
#     # Trả về: tạo nhiều file mp3 segment và trả về file đầu tiên.
#     # => FE nên dùng synthesize_segments_to_urls() để play nối tiếp.
#     first_file = out_path / f"tts_{uuid.uuid4().hex}_seg0.mp3"
#     gTTS(text=segments[0], lang=lang).save(str(first_file))

#     for i, seg in enumerate(segments[1:], start=1):
#         seg_file = out_path / f"tts_{uuid.uuid4().hex}_seg{i}.mp3"
#         gTTS(text=seg, lang=lang).save(str(seg_file))

#     return str(first_file)


# def synthesize_segments(
#     text: str,
#     out_dir: str = "data/audio",
#     lang: str = "vi",
#     max_chars: int = 180,
# ) -> List[str]:
#     """
#     Realtime-friendly: tạo nhiều file mp3 nhỏ, trả về list đường dẫn file.
#     FE có thể play nối tiếp để tạo cảm giác realtime.
#     """
#     out_path = Path(out_dir)
#     out_path.mkdir(parents=True, exist_ok=True)

#     segments = split_text_for_tts(text, max_chars=max_chars)
#     paths: List[str] = []

#     for idx, seg in enumerate(segments):
#         file_path = out_path / f"tts_{uuid.uuid4().hex}_seg{idx}.mp3"
#         gTTS(text=seg, lang=lang).save(str(file_path))
#         paths.append(str(file_path))

#     return paths


# def synthesize_segments_to_urls(
#     text: str,
#     lang: str = "vi",
#     max_chars: int = 180,
#     out_dir: str = "data/audio",
#     static_prefix: str = "/static/audio/",
# ) -> List[dict]:
#     """
#     Trả về list segment dạng:
#     [
#       {"index": 0, "text": "...", "audio_url": "/static/audio/tts_xxx_seg0.mp3"},
#       ...
#     ]
#     Yêu cầu: main.py mount StaticFiles(directory="data") => /static/audio/... map tới data/audio/...
#     """
#     out_path = Path(out_dir)
#     out_path.mkdir(parents=True, exist_ok=True)

#     segments = split_text_for_tts(text, max_chars=max_chars)
#     results: List[dict] = []

#     for idx, seg in enumerate(segments):
#         filename = f"tts_{uuid.uuid4().hex}_seg{idx}.mp3"
#         file_path = out_path / filename
#         gTTS(text=seg, lang=lang).save(str(file_path))

#         results.append({
#             "index": idx,
#             "text": seg,
#             "audio_url": f"{static_prefix}{filename}",
#         })

#     return results

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
