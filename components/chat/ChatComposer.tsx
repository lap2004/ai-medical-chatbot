import React, { useCallback, useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { VoiceTranscriptionPill } from "./VoiceTranscriptionPill";

type Props = {
  loading: boolean;
  onSend: (text: string) => void;
};

export const ChatComposer: React.FC<Props> = ({ loading, onSend }) => {
  const [input, setInput] = useState("");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  // DEBUG extra: insecure context / protocol
  const isSecureContext =
    typeof window !== "undefined" ? (window.isSecureContext ?? false) : false;
  const protocol =
    typeof window !== "undefined" ? window.location.protocol : "";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  // Khi đang nghe: đổ transcript vào input
  useEffect(() => {
    if (!listening) return;
    if (!transcript) return;
    setInput(transcript);
  }, [listening, transcript]);

  const startVoice = useCallback(async () => {
    if (!browserSupportsSpeechRecognition) {
      alert("Browser không hỗ trợ SpeechRecognition. Hãy thử Chrome/Edge.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      console.error("[VOICE] getUserMedia error:", e);
      alert("Không truy cập được microphone. Hãy cấp quyền mic cho site.");
      return;
    }

    resetTranscript();

    SpeechRecognition.stopListening();

    SpeechRecognition.startListening({
      continuous: true,
      interimResults: true,
      language: "vi-VN",
    });
  }, [
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    isSecureContext,
    protocol,
    resetTranscript,
  ]);

  const stopVoice = useCallback(() => {
    setSendOnStop(true);
    SpeechRecognition.stopListening();
  }, []);

  const [sendOnStop, setSendOnStop] = useState(false);
  useEffect(() => {
    if (listening) return;
    if (!sendOnStop) return;

    setSendOnStop(false);

    const text = (transcript || input).trim();
    if (!text) {
      resetTranscript();
      return;
    }

    onSend(text);
    setInput("");
    resetTranscript();
  }, [listening, sendOnStop, transcript, input, onSend, resetTranscript]);

  const toggleVoice = useCallback(() => {
    if (loading) return;
    if (listening) stopVoice();
    else startVoice();
  }, [loading, listening, startVoice, stopVoice]);

  const handleSend = useCallback(() => {
    if (loading) return;
    const text = input.trim();
    if (!text) return;

    if (listening) stopVoice();

    onSend(text);
    setInput("");
    resetTranscript();
  }, [input, loading, onSend, listening, stopVoice, resetTranscript]);

  return (
    <div className="relative bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6">
      {listening && (
        <VoiceTranscriptionPill
          text={transcript}
          onClose={() => {
            setSendOnStop(false);
            stopVoice();
            resetTranscript();
          }}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-center gap-3">
          <div className="flex-1 relative">
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-icons-round">add_circle</span>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
              placeholder={
                listening
                  ? "Listening..."
                  : "Tell me more about your symptoms..."
              }
              className="w-full pl-14 pr-14 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-teal-500/20 disabled:opacity-60 disabled:hover:scale-100"
            >
              <span className="material-icons-round text-xl">send</span>
            </button>
          </div>

          <button
            type="button"
            onClick={toggleVoice}
            disabled={loading || !browserSupportsSpeechRecognition}
            className={`group flex flex-col items-center justify-center w-14 h-14
              bg-white dark:bg-slate-800 border-2 rounded-2xl transition-all shrink-0
              ${listening ? "border-primary hover:bg-primary/5" : "border-primary/20 hover:border-primary hover:bg-primary/5"}
              ${!browserSupportsSpeechRecognition ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="material-icons-round text-primary text-2xl group-hover:scale-110 transition-transform">
              {listening ? "stop_circle" : "mic"}
            </span>
            <span className="text-[8px] font-bold text-primary mt-0.5">
              {listening ? "STOP" : "VOICE"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
