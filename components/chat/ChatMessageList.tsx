import React, { useEffect, useMemo, useRef, useState } from "react";
import { TriageCard } from "./TriageCard";
import type { Message } from "@/types/chat";

type Props = {
  messages: Message[];
  loading: boolean;
  onSelectTriage: (answer: string) => void;
};

export const ChatMessageList: React.FC<Props> = ({
  messages,
  loading,
  onSelectTriage,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  // Date header theo message đầu tiên (không phải today)
  const headerDate = useMemo(() => {
    const first = messages?.[0]?.createdAt;
    return first ? new Date(first) : new Date();
  }, [messages]);

  // theo dõi user có đang ở gần đáy không
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setStickToBottom(dist < 120);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // auto-scroll chỉ khi stickToBottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!stickToBottom) return;

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, loading, stickToBottom]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/20 custom-scrollbar"
    >
      <div className="text-center py-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-4 py-1.5 border border-slate-200 dark:border-slate-800 rounded-full">
          {headerDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-start ${
            msg.role === "user" ? "justify-end" : "justify-start"
          } space-x-4`}
        >
          {msg.role === "assistant" && (
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-icons-round text-white text-sm">
                smart_toy
              </span>
            </div>
          )}

          <div className="flex flex-col space-y-3">
            {msg.triage ? (
              <TriageCard
                questions={msg.triage.questions}
                suggestedAnswers={msg.triage.suggestedAnswers}
                onSelect={onSelectTriage}
              />
            ) : (
              <div
                className={`p-5 shadow-sm border ${
                  msg.role === "user"
                    ? "bg-primary text-white border-primary rounded-3xl rounded-tr-none max-w-xl"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700 rounded-3xl rounded-tl-none max-w-3xl"
                }`}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            )}

            <div
              className={`flex items-center space-x-2 ${
                msg.role === "user" ? "justify-end mr-1" : "ml-1"
              }`}
            >
              {msg.role === "user" && (
                <span className="material-icons-round text-[12px] text-green-500">
                  done_all
                </span>
              )}
              <span className="text-[10px] font-medium text-slate-400">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex items-start space-x-4">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="material-icons-round text-white text-sm animate-pulse">
              smart_toy
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl rounded-tl-none border border-slate-100 dark:border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-300" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
