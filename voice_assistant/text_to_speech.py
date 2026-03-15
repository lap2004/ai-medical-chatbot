import logging
import subprocess
from openai import OpenAI


def text_to_speech(model: str, api_key: str, text: str, output_file_path: str):
    """
    Generate TTS audio file (fallback mode).
    Supports: openai
    """
    if model != "openai":
        raise ValueError(f"Unsupported TTS model (OpenAI only): {model}")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is required for OpenAI TTS")
    if not isinstance(text, str) or not text.strip():
        raise ValueError("text must be a non-empty string")

    client = OpenAI(api_key=api_key)

    # ✅ Removed unsupported 'format' kwarg
    with client.audio.speech.with_streaming_response.create(
        model="gpt-4o-mini-tts",
        voice="nova",
        input=text,
        speed=1.15,
    ) as response:
        response.stream_to_file(output_file_path)

    logging.info(f"TTS saved: {output_file_path}")
    return output_file_path


def speak_openai_stream(api_key: str, text: str, voice: str = "nova", speed: float = 1.15):
    """
    Speak immediately by streaming OpenAI TTS audio bytes to ffplay (stdin).
    Requires ffplay (ffmpeg) in PATH.
    """
    if not api_key:
        raise ValueError("OPENAI_API_KEY is required for OpenAI TTS streaming")
    if not isinstance(text, str) or not text.strip():
        return

    client = OpenAI(api_key=api_key)

    proc = subprocess.Popen(
        ["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet", "-i", "pipe:0"],
        stdin=subprocess.PIPE,
    )

    # ✅ Removed unsupported 'format' kwarg
    with client.audio.speech.with_streaming_response.create(
        model="gpt-4o-mini-tts",
        voice=voice,
        input=text,
        speed=speed,
    ) as response:
        for chunk in response.iter_bytes():
            proc.stdin.write(chunk)

    proc.stdin.close()
    proc.wait()
