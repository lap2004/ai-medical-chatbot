import React from "react";
type Props = {
    text: string;
    onClose: () => void;
};
export const VoiceTranscriptionPill: React.FC<Props> = ({ text, onClose }) => {
    return (
        <div className="absolute -top-14 left-0 right-0 px-4">
            <div className="mx-auto max-w-4xl bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
                <div className="flex items-center gap-1 text-primary">
                    <span className="w-1 h-4 rounded-full bg-current animate-pulse" />
                    <span className="w-1 h-6 rounded-full bg-current animate-pulse" />
                    <span className="w-1 h-3 rounded-full bg-current animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-300">
                        Voice Transcription
                    </div>
                    <div className="text-sm italic text-slate-500 truncate">
                        “{text || "Listening..."}”
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close voice"
                >
                    <span className="material-icons-round text-slate-500">close</span>
                </button>
            </div>
        </div>
    );
};
