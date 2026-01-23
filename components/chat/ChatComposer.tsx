import React, { useCallback, useState } from "react";

type Props = {
  loading: boolean;
  onSend: (text: string) => void;
};

export const ChatComposer: React.FC<Props> = ({ loading, onSend }) => {
  const [input, setInput] = useState("");

  const handleSend = useCallback(() => {
    if (loading) return;
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  }, [input, loading, onSend]);

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-center gap-3">
          <div className="flex-1 relative">
            <button className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary transition-colors">
              <span className="material-icons-round">add_circle</span>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
              placeholder="Tell me more about your symptoms..."
              className="w-full pl-14 pr-14 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />

            <button
              onClick={handleSend}
              disabled={loading}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-teal-500/20 disabled:opacity-60 disabled:hover:scale-100"
            >
              <span className="material-icons-round text-xl">send</span>
            </button>
          </div>

          <button className="group flex flex-col items-center justify-center w-14 h-14 bg-white dark:bg-slate-800 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-2xl transition-all shrink-0">
            <span className="material-icons-round text-primary text-2xl group-hover:scale-110 transition-transform">
              mic
            </span>
            <span className="text-[8px] font-bold text-primary mt-0.5">
              VOICE
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span>Secure Channel Active</span>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
            Not for medical emergencies. By using this service you agree to our{" "}
            <a href="#" className="underline font-medium hover:text-primary">
              Terms of Use
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};
