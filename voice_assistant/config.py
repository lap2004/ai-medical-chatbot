import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    TRANSCRIPTION_MODEL = os.getenv("TRANSCRIPTION_MODEL", "openai").lower()
    RESPONSE_MODEL = os.getenv("RESPONSE_MODEL", "openai").lower()
    TTS_MODEL = os.getenv("TTS_MODEL", "openai").lower() 
    OPENAI_LLM = os.getenv("OPENAI_LLM", "gpt-4o")
    GROQ_LLM = os.getenv("GROQ_LLM", "llama-3.1-8b-instant")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    INPUT_AUDIO = os.getenv("INPUT_AUDIO", "test.mp3")
    OUTPUT_AUDIO = os.getenv("OUTPUT_AUDIO", "output.mp3")

    @staticmethod
    def validate_config():
        """
        Validate model options and required API keys.
        Raises ValueError with a clear message if misconfigured.
        """
        Config._validate_model("TRANSCRIPTION_MODEL", ["openai", "groq"])
        Config._validate_model("RESPONSE_MODEL", ["openai", "groq"])
        Config._validate_model("TTS_MODEL", ["openai"])  

        if Config.TRANSCRIPTION_MODEL == "openai" and not Config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required when TRANSCRIPTION_MODEL=openai")
        if Config.TRANSCRIPTION_MODEL == "groq" and not Config.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is required when TRANSCRIPTION_MODEL=groq")
        if Config.RESPONSE_MODEL == "openai" and not Config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required when RESPONSE_MODEL=openai")
        if Config.RESPONSE_MODEL == "groq" and not Config.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is required when RESPONSE_MODEL=groq")
        if Config.TTS_MODEL == "openai" and not Config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required when TTS_MODEL=openai")

    @staticmethod
    def _validate_model(attribute: str, valid_options: list[str]):
        value = getattr(Config, attribute)
        if value not in valid_options:
            raise ValueError(f"Invalid {attribute}='{value}'. Must be one of: {valid_options}")
