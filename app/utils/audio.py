# app/utils/audio_io.py
from pathlib import Path
import uuid
from fastapi import UploadFile

AUDIO_TMP_DIR = Path("data/uploads")
AUDIO_TMP_DIR.mkdir(parents=True, exist_ok=True)

def save_upload_to_temp(file: UploadFile) -> str:
    """
    Lưu UploadFile (mp3/m4a/wav/webm/ogg, ...) vào thư mục tạm và trả về path.
    """
    suffix = ""
    if file.filename and "." in file.filename:
        suffix = "." + file.filename.split(".")[-1].lower()
    dst = AUDIO_TMP_DIR / f"up_{uuid.uuid4().hex}{suffix}"
    with dst.open("wb") as f:
        f.write(file.file.read())
    return str(dst)
