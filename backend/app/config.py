from __future__ import annotations

import json
import os
from typing import List, Union, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    database_url: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", ""))
    database_url_async: str = Field(default_factory=lambda: os.getenv("DATABASE_URL_ASYNC", ""))

    pghost: str = Field(default_factory=lambda: os.getenv("PGHOST", "127.0.0.1"))
    pgport: int = Field(default_factory=lambda: int(os.getenv("PGPORT", "5432")))
    pgdatabase: str = Field(default_factory=lambda: os.getenv("PGDATABASE", "aibacsi"))
    pguser: str = Field(default_factory=lambda: os.getenv("PGUSER", "aibacsi"))
    pgpassword: str = Field(default_factory=lambda: os.getenv("PGPASSWORD", "123456"))
    
    SMTP_EMAIL: str
    SMTP_PASSWORD: str
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "super-secret")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    google_client_id: str
    google_client_secret: str
    nextauth_url: str
    nextauth_secret: str

    embedding_model: str = Field(default="BAAI/bge-m3")
    embedding_dim: int = Field(default=1024)
    use_fake_embedder: bool = Field(default=False)
    rag_table: str = Field(default="medical_012026")
    qa_topk: int = Field(default=5)

    gemini_api_key: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    gemini_model: str = Field(default_factory=lambda: os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash"))

    allow_signup: bool = Field(default=True)   

    allowed_origins: Union[str, List[str]] = Field(default_factory=lambda: os.getenv("ALLOWED_ORIGINS", "*"))
    host: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    port: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))

    log_level: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    log_file: str = Field(default_factory=lambda: os.getenv("LOG_FILE", "logs/app.log"))
    
    data_path: str = Field(default_factory=lambda: os.getenv("DATA_PATH", "data/data.json"))
    word_filter_path: str = Field(default_factory=lambda: os.getenv("WORD_FILTER_PATH", "data/word_filter.json"))

    stt_provider: str = Field(default_factory=lambda: os.getenv("STT_PROVIDER", "local"))
    stt_language: str = Field(default_factory=lambda: os.getenv("STT_LANGUAGE", "vi-VN"))
    stt_sample_rate: int = Field(default_factory=lambda: int(os.getenv("STT_SAMPLE_RATE", "16000")))
    stt_model_size: str = Field(default_factory=lambda: os.getenv("STT_MODEL_SIZE", "base"))
    stt_device: str = Field(default_factory=lambda: os.getenv("STT_DEVICE", "auto"))
    stt_compute: str = Field(default_factory=lambda: os.getenv("STT_COMPUTE", "auto"))
    audio_tmp_dir: str = Field(default_factory=lambda: os.getenv("AUDIO_TMP_DIR", "data/uploads"))

    tts_provider: str = Field(default_factory=lambda: os.getenv("TTS_PROVIDER", "local"))
    tts_language: str = Field(default_factory=lambda: os.getenv("TTS_LANGUAGE", "vi"))
    tts_voice_name: str = Field(default_factory=lambda: os.getenv("TTS_VOICE_NAME", ""))
    tts_audio_format: str = Field(default_factory=lambda: os.getenv("TTS_AUDIO_FORMAT", "mp3"))

    ffmpeg_bin: str = Field(default_factory=lambda: os.getenv("FFMPEG_BIN", ""))

    static_dir: str = Field(default_factory=lambda: os.getenv("STATIC_DIR", "data"))
    audio_output_dir: str = Field(default_factory=lambda: os.getenv("AUDIO_OUTPUT_DIR", "data/audio"))
    uploads_dir: str = Field(default_factory=lambda: os.getenv("UPLOADS_DIR", "data/uploads"))

    jwt_secret: str = "change-me"
    jwt_alg: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  

    admin_email: str
    admin_password: str
    
    @field_validator("allowed_origins", mode="before")
    @classmethod
    def _normalize_origins(cls, v):
        if v is None:
            return ["*"]

        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]

        s = str(v).strip()

        if s.startswith("[") and s.endswith("]"):
            try:
                parsed = json.loads(s)
                if isinstance(parsed, list):
                    return [str(x).strip() for x in parsed if str(x).strip()]
            except Exception:
                pass

        if s == "" or s == "*":
            return ["*"]

        return [x.strip() for x in s.split(",") if x.strip()]

settings = Settings()
if not settings.database_url:
    settings.database_url = (
        f"postgresql+psycopg2://{settings.pguser}:{settings.pgpassword}"
        f"@{settings.pghost}:{settings.pgport}/{settings.pgdatabase}"
    )
