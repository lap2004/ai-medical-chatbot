import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeechRec = any;

function getCtor(): any | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useNativeSpeechToText(lang = "en-US") {
  const Ctor = useMemo(
    () => (typeof window !== "undefined" ? getCtor() : null),
    [],
  );
  const supported = !!Ctor;

  const recRef = useRef<SpeechRec | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true; // ✅ quan trọng để thấy text ngay
    rec.lang = lang;

    rec.onstart = () => {
      console.log("[SR] onstart");
      setError(null);
      setIsListening(true);
    };

    rec.onend = () => {
      console.log("[SR] onend");
      setIsListening(false);
      setInterim("");
    };

    rec.onerror = (e: any) => {
      console.log("[SR] onerror:", e);
      setError(e?.error ? String(e.error) : "speech_error");
    };

    rec.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const t = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += t;
        else interimText += t;
      }

      if (interimText) setInterim(interimText);
      if (finalText)
        setTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText));

      console.log("[SR] result:", { finalText, interimText });
    };

    recRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {}
      recRef.current = null;
    };
  }, [Ctor, lang, supported]);

  const start = useCallback(() => {
    if (!supported) return;
    setTranscript("");
    setInterim("");
    setError(null);
    try {
      recRef.current?.start();
    } catch (e) {
      // start() hay throw nếu gọi 2 lần quá nhanh
      console.log("[SR] start threw:", e);
    }
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    try {
      recRef.current?.stop();
    } catch (e) {
      console.log("[SR] stop threw:", e);
    }
  }, [supported]);

  const toggle = useCallback(() => {
    if (!supported) return;
    if (isListening) stop();
    else start();
  }, [supported, isListening, start, stop]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return {
    supported,
    isListening,
    transcript,
    interim,
    error,
    start,
    stop,
    toggle,
    reset,
  };
}
