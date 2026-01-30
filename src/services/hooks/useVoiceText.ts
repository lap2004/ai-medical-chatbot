import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export function useVoiceText(lang: string = "en-US") {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const start = () => {
    if (!browserSupportsSpeechRecognition) return;
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language: lang });
  };

  const stop = () => SpeechRecognition.stopListening();

  const toggle = () => (listening ? stop() : start());

  return {
    supported: browserSupportsSpeechRecognition,
    isListening: listening,
    transcript,
    start,
    stop,
    toggle,
    reset: resetTranscript,
    error: null as string | null, // WebSpeech errors không expose dễ; nếu cần mình sẽ bổ sung event listeners
  };
}
