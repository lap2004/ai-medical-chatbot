import logging
from openai import OpenAI
from groq import Groq
from voice_assistant.config import Config

def _generate_openai_response(api_key, messages):
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=Config.OPENAI_LLM,
        messages=messages,
        temperature=0.1,
    )
    return response.choices[0].message.content.strip()

def _generate_groq_response(api_key, messages):
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model=Config.GROQ_LLM,
        messages=messages,
        temperature=0.1,
    )
    return response.choices[0].message.content.strip()

def generate_response(model_type, api_key, messages):
    try:
        if model_type == "openai":
            return _generate_openai_response(api_key, messages)

        elif model_type == "groq":
            return _generate_groq_response(api_key, messages)

        else:
            raise ValueError(f"Unsupported RESPONSE_MODEL: {model_type}")

    except Exception as e:
        logging.error(f"LLM generation error ({model_type}): {e}")
        return (
            "Tôi gặp sự cố khi tạo câu trả lời. "
            "Bạn vui lòng thử lại hoặc hỏi theo cách khác."
        )
