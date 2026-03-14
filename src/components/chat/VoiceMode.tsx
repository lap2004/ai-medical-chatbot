import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from "lucide-react";

type ConnState = "IDLE" | "DIALING" | "CONNECTING" | "CONNECTED" | "ERROR";
type WSMsg =
  | { type: "info"; message?: string }
  | { type: "debug"; rms?: number; energy?: number; vad?: boolean; gate?: boolean }
  | { type: "vad"; state: string }
  | { type: "final_transcript"; text?: string }
  | { type: "assistant_text"; text?: string }
  | { type: "tts_audio_b64"; data: string; mime?: string };

type ChatRole = "you" | "assistant" | "system";
type ChatItem = {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
};
const VOICE_DOMAIN = import.meta.env.VITE_VOICE_DOMAIN;
function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function b64ToBlob(b64: string, mime: string) {
  const byteChars = atob(b64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
function floatTo16BitPCM(float32: Float32Array) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? (s * 0x8000) : (s * 0x7fff);
  }
  return out.buffer;
}
function downsampleTo16kAndEncodeInt16(float32: Float32Array, inRate: number, outRate: number) {
  if (outRate >= inRate) return floatTo16BitPCM(float32);

  const ratio = inRate / outRate;
  const newLen = Math.floor(float32.length / ratio);
  if (newLen <= 0) return new ArrayBuffer(0);

  const result = new Int16Array(newLen);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);

    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < float32.length; i++) {
      accum += float32[i];
      count++;
    }
    const sample = count ? accum / count : 0;

    const s = Math.max(-1, Math.min(1, sample));
    result[offsetResult] = s < 0 ? (s * 0x8000) : (s * 0x7fff);

    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result.buffer;
}

export const VoiceMode: React.FC = () => {
  // toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // live latest text (optional)
  const [transcript, setTranscript] = useState("");
  const [assistant, setAssistant] = useState("");

  // conversation log (as chat)
  const [history, setHistory] = useState<ChatItem[]>([
    { id: uid(), role: "system", text: "Press CALL — it will connect in 3 seconds.", ts: Date.now() },
  ]);

  // status
  const [conn, setConn] = useState<ConnState>("IDLE");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [sendBps, setSendBps] = useState(0);

  // config
  // const WS_URL = "wss://attorney-gregory-diff-wives.trycloudflare.com/ws-call";
const WS_URL = `wss://${VOICE_DOMAIN}/ws-call`;
  // refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const zeroGainRef = useRef<GainNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const isTtsMutedRef = useRef(false);

  const dialTimerRef = useRef<number | null>(null);
  const sentBytesRef = useRef(0);
  const bpsTimerRef = useRef<number | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  const append = (role: ChatRole, text: string) => {
    const t = (text || "").trim();
    if (!t) return;
    setHistory((prev) => {
      const next = [...prev, { id: uid(), role, text: t, ts: Date.now() }];
      // giữ tối đa 80 dòng cho nhẹ UI
      return next.length > 80 ? next.slice(next.length - 80) : next;
    });
  };

  // auto scroll to bottom when history changes
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history.length]);

  const wsSendJson = (obj: any) => {
    try {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
    } catch {}
  };

  const setTtsMute = (muted: boolean, reason?: string) => {
    isTtsMutedRef.current = muted;
    wsSendJson({ type: "client_tts", state: muted ? "start" : "end", reason: reason || "" });
  };

  const startBps = () => {
    if (bpsTimerRef.current) window.clearInterval(bpsTimerRef.current);
    bpsTimerRef.current = window.setInterval(() => {
      setSendBps(sentBytesRef.current);
      sentBytesRef.current = 0;
    }, 1000);
  };
  const stopBps = () => {
    if (bpsTimerRef.current) window.clearInterval(bpsTimerRef.current);
    bpsTimerRef.current = null;
    sentBytesRef.current = 0;
    setSendBps(0);
  };

  const stopAll = async () => {
    try { processorRef.current?.disconnect(); } catch {}
    try { micSourceRef.current?.disconnect(); } catch {}
    try { zeroGainRef.current?.disconnect(); } catch {}
    try { await audioCtxRef.current?.close(); } catch {}
    try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}

    processorRef.current = null;
    micSourceRef.current = null;
    zeroGainRef.current = null;
    audioCtxRef.current = null;
    micStreamRef.current = null;

    isTtsMutedRef.current = false;
    setIsMicActive(false);
    setIsSpeaking(false);
    stopBps();
  };

  const startMicStream = async () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    micStreamRef.current = micStream;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = audioCtx;

    const inputSampleRate = audioCtx.sampleRate;
    const targetSampleRate = 16000;

    const micSource = audioCtx.createMediaStreamSource(micStream);
    micSourceRef.current = micSource;

    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const ws2 = wsRef.current;
      if (!ws2 || ws2.readyState !== WebSocket.OPEN) return;

      if (isMuted) return;
      if (isTtsMutedRef.current) return;

      const input = e.inputBuffer.getChannelData(0);
      const pcm16k = downsampleTo16kAndEncodeInt16(input, inputSampleRate, targetSampleRate);
      if (pcm16k && pcm16k.byteLength > 0) {
        ws2.send(pcm16k);
        sentBytesRef.current += pcm16k.byteLength;
      }
    };

    const zeroGain = audioCtx.createGain();
    zeroGain.gain.value = 0;
    zeroGainRef.current = zeroGain;

    micSource.connect(processor);
    processor.connect(zeroGain);
    zeroGain.connect(audioCtx.destination);

    setIsMicActive(true);
    append("system", "Mic started.");
  };

  const connectWS = () => {
    // close old
    try {
      const old = wsRef.current;
      if (old && (old.readyState === WebSocket.OPEN || old.readyState === WebSocket.CONNECTING)) old.close();
    } catch {}

    setConn("CONNECTING");
    append("system", "Connecting…");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = async () => {
      setConn("CONNECTED");
      append("system", "Connected.");
      startBps();

      try {
        await startMicStream();
      } catch {
        setConn("ERROR");
        append("system", "Mic permission error.");
        await stopAll();
        alert("Không mở được mic. Hãy cho phép microphone và thử lại.");
      }
    };

    ws.onmessage = (ev) => {
      let data: WSMsg;
      try {
        data = JSON.parse(ev.data);
      } catch {
        // ignore non-json like your original code
        return;
      }

      if (data.type === "info") {
        append("system", `INFO: ${data.message || ""}`.trim());
        return;
      }

      if (data.type === "vad") {
        if (data.state === "speech_start") setIsSpeaking(true);
        else if (data.state.startsWith("speech_end")) setIsSpeaking(false);
        return;
      }

      if (data.type === "final_transcript") {
        const text = data.text || "";
        setTranscript(text);
        append("you", text);
        return;
      }

      if (data.type === "assistant_text") {
        const text = data.text || "";
        setAssistant(text);
        append("assistant", text);
        return;
      }

      if (data.type === "tts_audio_b64") {
        const audioEl = audioElRef.current;
        if (!audioEl) return;

        const blob = b64ToBlob(data.data, data.mime || "audio/mpeg");
        const audioUrl = URL.createObjectURL(blob);

        setTtsMute(true, "tts_audio_b64");
        setIsSpeaking(true);

        audioEl.src = audioUrl;
        audioEl.muted = !isSpeakerOn;
        audioEl.play().catch(() => {});
        return;
      }
    };

    ws.onerror = () => {
      setConn("ERROR");
      append("system", "WS error.");
    };

    ws.onclose = async () => {
      setConn("IDLE");
      append("system", "Disconnected.");
      await stopAll();
    };
  };

  const startCall = () => {
    if (conn !== "IDLE" && conn !== "ERROR") return;

    // reset visible snippet
    setTranscript("");
    setAssistant("");
    setIsSpeaking(false);

    setConn("DIALING");
    append("system", "Calling… (connecting in 3s)");

    if (dialTimerRef.current) window.clearTimeout(dialTimerRef.current);
    dialTimerRef.current = window.setTimeout(() => {
      connectWS();
    }, 3000);
  };

  const hangup = async () => {
    if (dialTimerRef.current) window.clearTimeout(dialTimerRef.current);
    dialTimerRef.current = null;

    try { wsRef.current?.close(1000, "hangup"); } catch {}
    wsRef.current = null;

    setConn("IDLE");
    append("system", "Hangup.");
    await stopAll();
  };

  // speaker toggle affects audio element
  useEffect(() => {
    if (audioElRef.current) audioElRef.current.muted = !isSpeakerOn;
  }, [isSpeakerOn]);

  // audio events => auto mute/unmute mic during playback
  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;

    const onPlay = () => {
      setTtsMute(true, "audio_play");
      setIsSpeaking(true);
    };
    const onPause = () => {
      setTtsMute(false, "audio_pause");
      setIsSpeaking(false);
    };
    const onEnded = () => {
      setTimeout(() => {
        setTtsMute(false, "audio_ended");
        setIsSpeaking(false);
      }, 300);
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (dialTimerRef.current) window.clearTimeout(dialTimerRef.current);
      dialTimerRef.current = null;

      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
      void stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusText = useMemo(() => {
    const micTxt = !isMicActive ? "MIC OFF" : isMuted || isTtsMutedRef.current ? "MIC MUTED" : "MIC ON";
    const wsTxt =
      conn === "IDLE" ? "IDLE" :
      conn === "DIALING" ? "CALLING…" :
      conn === "CONNECTING" ? "CONNECTING…" :
      conn === "CONNECTED" ? "LIVE" : "ERROR";
    const speakTxt = isSpeaking ? "SPEAKING" : "LISTENING";
    const bps = conn === "CONNECTED" ? ` • SEND ${sendBps} B/s` : "";
    return `${wsTxt} • ${micTxt} • ${speakTxt}${bps}`;
  }, [conn, isMicActive, isMuted, isSpeaking, sendBps]);

  const dotClass = useMemo(() => {
    if (conn === "CONNECTED") return "bg-teal-500";
    if (conn === "DIALING" || conn === "CONNECTING") return "bg-amber-400";
    if (conn === "ERROR") return "bg-red-500";
    return "bg-slate-300";
  }, [conn]);

  const inCall = conn === "CONNECTED" || conn === "CONNECTING" || conn === "DIALING";

return (
  <div className="w-full min-h-screen overflow-y-auto">
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
      <audio ref={audioElRef} className="hidden" />

      {/* Top */}
      <div className="flex flex-col items-center space-y-3 sm:space-y-4">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-tr from-teal-400 to-blue-500">
            <img
              src="https://picsum.photos/seed/rebecca/200/200"
              alt="Doctor AI"
              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-950"
            />
          </div>
          <div className={`absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 ${dotClass} border-4 border-white dark:border-slate-950 rounded-full`} />
        </div>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Doctor AI
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1 text-sm">
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-bold text-[10px] tracking-wide">
              VERIFIED ASSISTANT
            </span>
            <span className="text-slate-500">
              Professional Healthcare Specialist
            </span>
          </div>

          <div className="mt-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            {statusText}
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="mt-4 sm:mt-6 flex items-center justify-center gap-1.5 h-10 sm:h-12">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-1.5 bg-teal-600 rounded-full animate-pulse"
            style={{
              height: `${(isSpeaking ? 26 : 14) + Math.random() * (isSpeaking ? 22 : 10)}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Conversation */}
      <div className="mt-4 sm:mt-6 w-full max-w-3xl mx-auto">
        {/* IMPORTANT: max height by viewport so laptop never cut; page can still scroll */}
        <div
          ref={listRef}
           className="rounded-2xl px-2 py-2 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-sm
                     max-h-[calc(100vh-360px)] sm:max-h-[calc(100vh-420px)]"
        >
          <div className="flex flex-col gap-3">
            {history.map((m) => {
              if (m.role === "system") {
                return (
                  <div key={m.id} className="w-full flex justify-center">
                    <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold">
                      {m.text}
                    </div>
                  </div>
                );
              }

              const isYou = m.role === "you";
              return (
                <div key={m.id} className={`w-full flex ${isYou ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[82%] p-3 sm:p-4 shadow-sm",
                      isYou
                        ? "bg-[#0F5A50] text-white rounded-2xl rounded-tr-none"
                        : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-3xl",
                    ].join(" ")}  
                  >
                    <p className={isYou ? "font-medium italic text-base sm:text-lg leading-relaxed" : "text-base sm:text-lg leading-relaxed"}>
                      {`"${m.text}"`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex justify-between px-2">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            {transcript ? "You" : ""}
          </span>
          <span className="text-[10px] font-bold text-teal-600 tracking-widest uppercase">
            {assistant ? (isSpeaking ? "Doctor AI IS SPEAKING" : "Doctor AI") : ""}
          </span>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="mt-6 sm:mt-8 flex items-center justify-center gap-8 pb-4">
        {/* Mute */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                : "bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest">MUTE</span>
        </div>

        {/* Call/End */}
        <div className="flex flex-col items-center gap-2">
          {!inCall ? (
            <button
              onClick={startCall}
              className="w-16 h-16 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 transform hover:scale-105 transition-all"
            >
              <Phone className="w-8 h-8" />
            </button>
          ) : (
            <button
              onClick={hangup}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transform hover:scale-105 transition-all"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
          )}

          <span className={`text-[10px] font-bold tracking-widest ${inCall ? "text-red-500" : "text-teal-600"}`}>
            {inCall ? "END CALL" : "CALL"}
          </span>
        </div>

        {/* Speaker */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              !isSpeakerOn
                ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                : "bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest">SPEAKER</span>
        </div>
      </div>
    </div>
  </div>
);
};