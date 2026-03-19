import logging
import requests
from openai import OpenAI
from groq import Groq

FAST_WHISPER_URL = "http://127.0.0.1:8080"
_checked_fastwhisperapi = False

def _check_fastwhisperapi():
    global _checked_fastwhisperapi
    if _checked_fastwhisperapi:
        return

    try:
        r = requests.get(f"{FAST_WHISPER_URL}/info", timeout=2)
        if r.status_code != 200:
            raise RuntimeError(f"FastWhisperAPI not healthy: {r.status_code}")
    except Exception as e:
        raise RuntimeError(f"FastWhisperAPI not running at {FAST_WHISPER_URL}: {e}")

    _checked_fastwhisperapi = True

def transcribe_audio(model, api_key, audio_file_path, local_model_path=None):
    try:
        if model == "openai":
            return _openai(api_key, audio_file_path)

        if model == "groq":
            return _groq(api_key, audio_file_path)

        if model == "fastwhisperapi":
            return _fastwhisper(audio_file_path)

        raise ValueError(f"Unsupported STT model (OpenAI/Groq/FastWhisperAPI only): {model}")

    except Exception as e:
        logging.error(f"STT error ({model}): {e}")
        return ""

def _openai(api_key, audio_file_path):
    if not api_key:
        raise ValueError("OPENAI_API_KEY is required for OpenAI transcription")

    client = OpenAI(api_key=api_key)
    with open(audio_file_path, "rb") as f:
        return client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            language="vi",
            response_format="text",
        )

def _groq(api_key, audio_file_path):
    if not api_key:
        raise ValueError("GROQ_API_KEY is required for Groq transcription")

    client = Groq(api_key=api_key)
    with open(audio_file_path, "rb") as f:
        return client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=f,
            language="vi",
        ).text

def _fastwhisper(audio_file_path):
    _check_fastwhisperapi()
    with open(audio_file_path, "rb") as f:
        r = requests.post(
            f"{FAST_WHISPER_URL}/v1/transcriptions",
            files={"file": f},
            data={
                "model": "large-v3",
                "language": "vi",
                "vad_filter": True,
            },
            timeout=60,
        )

    r.raise_for_status()
    return r.json().get("text", "")
