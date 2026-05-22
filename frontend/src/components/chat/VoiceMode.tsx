import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
type ConnState = "IDLE" | "DIALING" | "CONNECTING" | "CONNECTED" | "ERROR";
type WSMsg =
  | { type: "error"; message?: string }
  | { type: "welcome"; text: string }
  | { type: "answer"; text: string; audio_b64?: string };
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
export const VoiceMode: React.FC = () => {
  const { t } = useTranslation();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [assistant, setAssistant] = useState("");
  const [history, setHistory] = useState<ChatItem[]>([
    { id: uid(), role: "system", text: t("voice.pressCallHint"), ts: Date.now() },
  ]);
  const [conn, setConn] = useState<ConnState>("IDLE");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [sendBps, setSendBps] = useState(0);
const WS_URL = `wss:
  const wsRef = useRef<WebSocket | null>(null);
  const recognizerRef = useRef<any>(null);
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
      return next.length > 80 ? next.slice(next.length - 80) : next;
    });
  };
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
    if (muted) {
      try { recognizerRef.current?.abort(); } catch {}
    } else {
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN && !isMuted) {
          try { recognizerRef.current?.start(); } catch {}
        }
      }, 500);
    }
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
    try { recognizerRef.current?.stop(); } catch {}
    recognizerRef.current = null;
    isTtsMutedRef.current = false;
    setIsMicActive(false);
    setIsSpeaking(false);
    stopBps();
  };
  const startMicStream = async () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      append("system", t("voice.micNotSupported"));
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "vi-VN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      if (isTtsMutedRef.current || isMuted) return;
      let finalTrans = "";
      let interimTrans = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTrans += e.results[i][0].transcript;
        } else {
          interimTrans += e.results[i][0].transcript;
        }
      }
      if (finalTrans) {
        const text = finalTrans.trim();
        setTranscript(""); 
        append("you", text);
        wsSendJson({ type: "text", text: text, tts: true });
        sentBytesRef.current += text.length; 
      } else {
        setTranscript(interimTrans.trim());
      }
    };
    rec.onstart = () => { setIsMicActive(true); setIsSpeaking(false); };
    rec.onerror = (e: any) => { console.error("Speech rec error", e); };
    rec.onend = () => {
      setIsMicActive(false);
      if (wsRef.current?.readyState === WebSocket.OPEN && !isTtsMutedRef.current && !isMuted) {
        try { rec.start(); } catch {}
      }
    };
    try { rec.start(); } catch {}
    recognizerRef.current = rec;
    append("system", t("voice.micStarted"));
  };
  useEffect(() => {
    if (isMuted) {
      try { recognizerRef.current?.abort(); } catch {}
    } else if (conn === "CONNECTED" && !isTtsMutedRef.current) {
      try { recognizerRef.current?.start(); } catch {}
    }
  }, [isMuted, conn]);
  const connectWS = () => {
    try {
      const old = wsRef.current;
      if (old && (old.readyState === WebSocket.OPEN || old.readyState === WebSocket.CONNECTING)) old.close();
    } catch {}
    setConn("CONNECTING");
    append("system", t("voice.connecting_msg"));
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";
    ws.onopen = async () => {
      setConn("CONNECTED");
      append("system", t("voice.connected_msg"));
      startBps();
      try {
        await startMicStream();
      } catch {
        setConn("ERROR");
        append("system", t("voice.micPermissionError"));
        await stopAll();
        alert(t("voice.micPermissionAlert"));
      }
    };
    ws.onmessage = (ev) => {
      let data: WSMsg;
      try {
        data = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (data.type === "error") {
        append("system", `ERROR: ${data.message || ""}`.trim());
        return;
      }
      if (data.type === "welcome") {
        const text = data.text || "";
        setAssistant(text);
        if (text) append("assistant", text);
        return;
      }
      if (data.type === "answer") {
        const text = data.text || "";
        setAssistant(text);
        if (text) append("assistant", text);
        if (data.audio_b64) {
          const audioEl = audioElRef.current;
          if (!audioEl) return;
          const blob = b64ToBlob(data.audio_b64, "audio/mpeg");
          const audioUrl = URL.createObjectURL(blob);
          setTtsMute(true, "audio_b64");
          setIsSpeaking(true);
          audioEl.src = audioUrl;
          audioEl.muted = !isSpeakerOn;
          audioEl.play().catch(() => {});
        }
        return;
      }
    };
    ws.onerror = () => {
      setConn("ERROR");
      append("system", t("voice.wsError"));
    };
    ws.onclose = async () => {
      setConn("IDLE");
      append("system", t("voice.disconnected"));
      await stopAll();
    };
  };
  const startCall = () => {
    if (conn !== "IDLE" && conn !== "ERROR") return;
    setTranscript("");
    setAssistant("");
    setIsSpeaking(false);
    setConn("DIALING");
    append("system", t("voice.dialing"));
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
    append("system", t("voice.hangup"));
    await stopAll();
  };
  const handleMuteClick = () => {
    if (isSpeaking && isTtsMutedRef.current) {
      const audioEl = audioElRef.current;
      if (audioEl) {
        audioEl.pause();
        audioEl.src = ""; 
        URL.revokeObjectURL(audioEl.src); 
      }
      isTtsMutedRef.current = false;
      setIsSpeaking(false);
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN && !isMuted) {
          try { recognizerRef.current?.start(); } catch {}
        }
      }, 200);
    } else {
      setIsMuted((prev) => !prev);
    }
  };
  useEffect(() => {
    if (audioElRef.current) audioElRef.current.muted = !isSpeakerOn;
  }, [isSpeakerOn]);
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
  <div className="flex flex-col w-full h-[calc(100vh-80px)] sm:h-[calc(100vh-90px)] overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
    <audio ref={audioElRef} className="hidden" />
    {/* Scrollable body */}
    <div className="flex-1 overflow-y-auto w-full px-4 sm:px-6 py-6 sm:py-8" ref={listRef}>
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        {/* Top Avatar */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-teal-400 to-blue-500 shadow-md">
            <img
              src="https:
              alt="Doctor AI"
              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900"
            />
          </div>
          <div className={`absolute bottom-2 right-2 w-5 h-5 ${dotClass} border-4 border-white dark:border-slate-900 rounded-full`} />
        </div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            Doctor AI
          </h2>
          <div className={`text-xs font-bold rounded-full px-5 py-2 inline-flex items-center gap-2 transition-all duration-500 ${
            conn === "IDLE" ? "bg-slate-100 dark:bg-slate-800 text-slate-500" :
            conn === "DIALING" ? "bg-amber-100 text-amber-600" :
            conn === "CONNECTING" ? "bg-blue-100 text-blue-600" :
            conn === "CONNECTED" && isSpeaking ? "bg-teal-100 text-teal-700" :
            conn === "CONNECTED" ? "bg-emerald-100 text-emerald-700" :
            "bg-red-100 text-red-500"
          }`}>
            {conn === "IDLE" && (
              <><span>📞</span><span>{t("voice.readyToCall")}</span></>
            )}
            {conn === "DIALING" && (
              <><span className="animate-pulse">🔔</span><span>{t("voice.calling")}</span></>
            )}
            {conn === "CONNECTING" && (
              <><span className="animate-spin inline-block">↻</span><span>{t("voice.connecting")}</span></>
            )}
            {conn === "CONNECTED" && isSpeaking && (
              <><span className="animate-pulse">🔊</span><span>{t("voice.speaking")}</span></>
            )}
            {conn === "CONNECTED" && !isSpeaking && (
              <><span className="animate-pulse">🎤</span><span>{t("voice.listening")}</span></>
            )}
            {conn === "ERROR" && (
              <><span>⚠️</span><span>{t("voice.connectionError")}</span></>
            )}
          </div>
        </div>
        {/* Wave - only show while in call */}
        {inCall && (
          <div className="my-4 flex items-end justify-center gap-1 h-14 w-full">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full ${
                  isSpeaking ? "bg-teal-500" :
                  conn === "DIALING" || conn === "CONNECTING" ? "bg-amber-400" :
                  "bg-emerald-400"
                }`}
                style={{
                  height: isSpeaking
                    ? `${20 + Math.sin((i / 7) * Math.PI) * 24}px`
                    : conn === "CONNECTED"
                    ? `${10 + Math.sin((i / 7) * Math.PI) * 10}px`
                    : `${6 + i * 2}px`,
                  animation: isSpeaking
                    ? `pulse ${0.4 + i * 0.1}s ease-in-out infinite alternate`
                    : `pulse ${1 + i * 0.15}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        )}
        {/* Conversation List */}
        <div className="w-full mt-6 pb-28">
          <div className="flex flex-col gap-4">
            {history.map((m) => {
              if (m.role === "system") {
                return null;
              }
              const isYou = m.role === "you";
              return (
                <div key={m.id} className={`w-full flex ${isYou ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[85%] p-4 sm:p-5 shadow-md",
                      isYou
                        ? "bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl rounded-tr-sm"
                        : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm drop-shadow-sm",
                    ].join(" ")}  
                  >
                    <p className={isYou ? "font-medium italic text-base sm:text-lg leading-relaxed" : "text-base sm:text-lg leading-relaxed"}>
                      {`"${m.text}"`}
                    </p>
                  </div>
                </div>
              );
            })}
            {/* Live interim transcript bubble */}
            {transcript && (
              <div className="w-full flex justify-end animate-in fade-in zoom-in duration-200">
                <div className="max-w-[82%] p-3 sm:p-4 shadow-sm bg-[#0F5A50]/70 text-white rounded-2xl rounded-tr-none">
                  <p className="font-medium italic text-base sm:text-lg leading-relaxed">
                    {`"${transcript}..."`}
                  </p>
                </div>
              </div>
            )}
            {/* Speaker Indicator inside chat */}
            {assistant && isSpeaking && (
              <div className="w-full flex justify-start my-2">
                 <span className="text-[10px] font-bold text-teal-600 tracking-widest uppercase animate-pulse">
                   {t("voice.doctorAiSpeaking")}
                 </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    {/* Fixed Bottom Controls */}
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50/90 dark:via-slate-950/90 to-transparent pt-12 pb-6 px-4 pointer-events-none">
      <div className="max-w-md mx-auto flex items-center justify-center gap-8 pointer-events-auto">
        {/* Mute */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleMuteClick}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
              isMuted
                ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                : isSpeaking
                ? "bg-amber-500/90 text-white hover:bg-amber-500 ring-2 ring-amber-400 ring-offset-2"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : isSpeaking ? <div className="w-5 h-5 bg-white rounded-[4px]" /> : <Mic className="w-6 h-6" />}
          </button>
          <span className="text-[10px] font-bold text-slate-500 tracking-widest">
            {isSpeaking ? t("voice.interrupt") : isMuted ? t("voice.unmute") : t("voice.mute")}
          </span>
        </div>
        {/* Call/End */}
        <div className="flex flex-col items-center gap-2">
          {!inCall ? (
            <button
              onClick={startCall}
              className="w-16 h-16 rounded-full bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 transform hover:scale-105 transition-all"
            >
              <Phone className="w-8 h-8" />
            </button>
          ) : (
            <button
              onClick={hangup}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transform hover:scale-105 transition-all"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
          )}
          <span className={`text-[10px] font-bold tracking-widest ${inCall ? "text-red-500" : "text-teal-600"}`}>
            {inCall ? t("voice.endCall") : t("voice.call")}
          </span>
        </div>
        {/* Speaker */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
              !isSpeakerOn
                ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
          <span className="text-[10px] font-bold text-slate-500 tracking-widest">{t("voice.speaker")}</span>
        </div>
      </div>
    </div>
  </div>
);
};