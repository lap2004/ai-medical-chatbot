from voice_assistant.config import Config

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
    },
}

def get_api_key(service: str, model: str):
    return API_KEY_MAPPING.get(service, {}).get(model)

def get_transcription_api_key():
    return get_api_key("transcription", Config.TRANSCRIPTION_MODEL)

def get_response_api_key():
    return get_api_key("response", Config.RESPONSE_MODEL)

def get_tts_api_key():
    return get_api_key("tts", Config.TTS_MODEL)
