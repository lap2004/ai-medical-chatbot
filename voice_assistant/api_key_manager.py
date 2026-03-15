from voice_assistant.config import Config

# Only OpenAI and Groq are supported
API_KEY_MAPPING = {
    "transcription": {
        "openai": Config.OPENAI_API_KEY,
        "groq": Config.GROQ_API_KEY,
    },
    "response": {
        "openai": Config.OPENAI_API_KEY,
        "groq": Config.GROQ_API_KEY,
    },
    "tts": {
        "openai": Config.OPENAI_API_KEY,
        # Groq currently does not support TTS
    },
}


def get_api_key(service: str, model: str):
    """
    Return API key for a given service and model.
    Returns None if the model does not require an API key.
    """
    return API_KEY_MAPPING.get(service, {}).get(model)


def get_transcription_api_key():
    """
    API key for speech-to-text (OpenAI or Groq).
    """
    return get_api_key("transcription", Config.TRANSCRIPTION_MODEL)


def get_response_api_key():
    """
    API key for LLM response generation (OpenAI or Groq).
    """
    return get_api_key("response", Config.RESPONSE_MODEL)


def get_tts_api_key():
    """
    API key for text-to-speech.
    Currently only OpenAI TTS is supported.
    """
    return get_api_key("tts", Config.TTS_MODEL)
