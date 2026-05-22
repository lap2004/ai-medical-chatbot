import logging
from functools import lru_cache
from io import BytesIO
import speech_recognition as sr
import pygame
import pydub

@lru_cache(maxsize=1)
def get_recognizer() -> sr.Recognizer:
    return sr.Recognizer()


def record_audio(
    file_path: str,
    timeout: int = 10,
    phrase_time_limit: int | None = None,
    retries: int = 3,
    energy_threshold: int = 2000,
    pause_threshold: float = 1.0,
    phrase_threshold: float = 0.6,
    dynamic_energy_threshold: bool = True,
    calibration_duration: float = 1.0,
) -> bool:

    recognizer = get_recognizer()
    recognizer.energy_threshold = energy_threshold
    recognizer.pause_threshold = pause_threshold
    recognizer.phrase_threshold = phrase_threshold
    recognizer.dynamic_energy_threshold = dynamic_energy_threshold

    for attempt in range(retries):
        try:
            with sr.Microphone() as source:
                logging.info("Calibrating for ambient noise...")
                recognizer.adjust_for_ambient_noise(source, duration=calibration_duration)

                logging.info("Recording started")
                audio_data = recognizer.listen(
                    source,
                    timeout=timeout,
                    phrase_time_limit=phrase_time_limit,
                )
                logging.info("Recording complete")

            wav_bytes = audio_data.get_wav_data()
            audio_segment = pydub.AudioSegment.from_wav(BytesIO(wav_bytes))
            audio_segment.export(
                file_path,
                format="mp3",
                bitrate="128k",
                parameters=["-ar", "22050", "-ac", "1"],
            )

            return True

        except sr.WaitTimeoutError:
            logging.warning(f"Listening timed out, retrying... ({attempt + 1}/{retries})")
            continue

        except Exception as e:
            logging.error(f"Failed to record audio: {e}")
            if attempt == retries - 1:
                raise

    logging.error("Recording failed after all retries")
    return False

def play_audio(file_path: str) -> None:
    try:
        pygame.mixer.init()
        pygame.mixer.music.load(file_path)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            pygame.time.wait(100)

    except pygame.error as e:
        logging.error(f"Failed to play audio: {e}")
    except Exception as e:
        logging.error(f"An unexpected error occurred while playing audio: {e}")
    finally:
        try:
            pygame.mixer.quit()
        except Exception:
            pass
