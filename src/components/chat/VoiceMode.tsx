import React, { useState } from "react";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";

export const VoiceMode: React.FC = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);

    return (
        <div className="flex-1 flex flex-col items-center justify-between p-6 max-w-4xl mx-auto w-full h-full">
            {/* Top Info */}
            <div className="flex flex-col items-center mt-8 space-y-4">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-teal-400 to-blue-500">
                        <img
                            src="https://picsum.photos/seed/rebecca/200/200"
                            alt="Rebecca AI"
                            className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900"
                        />
                    </div>
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-teal-500 border-4 border-white dark:border-slate-900 rounded-full"></div>
                </div>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Rebecca AI
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1 text-sm">
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-bold text-[10px] tracking-wide">
                            VERIFIED ASSISTANT
                        </span>
                        <span className="text-slate-500">
                            Professional Healthcare Specialist
                        </span>
                    </div>
                </div>
            </div>

            {/* Center Content */}
            <div className="flex-1 w-full flex flex-col items-center justify-center -mt-10 space-y-8">
                {/* Wave Animation (Static Mock) */}
                <div className="flex items-center justify-center gap-1.5 h-12">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 bg-teal-600 rounded-full animate-pulse"
                            style={{
                                height: `${Math.random() * 24 + 16}px`,
                                animationDelay: `${i * 0.1}s`,
                            }}
                        />
                    ))}
                </div>

                {/* User Bubble */}
                <div className="w-full flex justify-end">
                    <div className="max-w-[80%] bg-[#0F5A50] text-white p-4 rounded-2xl rounded-tr-none shadow-sm">
                        <p className="font-medium italic text-lg leading-relaxed">
                            "I've been having some mild chest tightness and a dry cough since
                            this morning..."
                        </p>
                    </div>
                </div>
                <div className="w-full flex justify-end -mt-6">
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mr-1">You</span>
                </div>

                {/* AI Response Card */}
                <div className="w-full flex justify-start">
                    <div className="max-w-[80%] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-3xl shadow-lg relative">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                            <span className="text-[10px] font-extrabold text-teal-700 dark:text-teal-400 tracking-widest uppercase">
                                REBECCA IS SPEAKING
                            </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                            "I understand. Chest tightness can be concerning. To help me assess
                            the situation better, could you tell me if the pain radiates to
                            your arm or neck?"
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center gap-8 mb-8">
                {/* Mute */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted
                            ? "bg-slate-200 text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                    >
                        {isMuted ? (
                            <MicOff className="w-6 h-6" />
                        ) : (
                            <Mic className="w-6 h-6" />
                        )}
                    </button>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest">
                        MUTE
                    </span>
                </div>

                {/* End Call */}
                <div className="flex flex-col items-center gap-2">
                    <button className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transform hover:scale-105 transition-all">
                        <PhoneOff className="w-8 h-8" />
                    </button>
                    <span className="text-[10px] font-bold text-red-500 tracking-widest">
                        END CALL
                    </span>
                </div>

                {/* Speaker */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!isSpeakerOn
                            ? "bg-slate-200 text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                    >
                        {isSpeakerOn ? (
                            <Volume2 className="w-6 h-6" />
                        ) : (
                            <VolumeX className="w-6 h-6" />
                        )}
                    </button>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest">
                        SPEAKER
                    </span>
                </div>
            </div>
        </div>
    );
};
