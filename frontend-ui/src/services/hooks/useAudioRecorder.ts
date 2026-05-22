import { useCallback, useMemo, useRef, useState } from "react";
type RecorderState = "idle" | "recording" | "stopping" | "error";
export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const supported = useMemo(() => {
    return (
      typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia
    );
  }, []);
  const start = useCallback(async () => {
    if (!supported) {
      setError("Mic not supported");
      setState("error");
      return;
    }
    if (state === "recording") return;
    setError(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onerror = () => {
        setError("Recorder error");
        setState("error");
      };
      mr.start();
      setState("recording");
    } catch (e: any) {
      setError(e?.message || "Mic permission denied");
      setState("error");
    }
  }, [supported, state]);
  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current;
      if (!mr || state !== "recording") {
        resolve(null);
        return;
      }
      setState("stopping");
      mr.onstop = () => {
        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        setState("idle");
        resolve(blob);
      };
      mr.stop();
    });
  }, [state]);
  const cancel = useCallback(() => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    setState("idle");
  }, []);
  return { supported, state, error, start, stop, cancel };
}
