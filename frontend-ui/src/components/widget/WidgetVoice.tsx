
import React from 'react';
export const WidgetVoice: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 dark:bg-slate-950/20">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/10 rounded-full scale-[1.5] animate-pulse"></div>
        <div className="relative w-32 h-32 rounded-full border-4 border-white dark:border-slate-700 overflow-hidden bg-primary/10">
          <img
            alt="Voice Avatar"
            className="w-full h-full object-cover"
            src="https://ui-avatars.com/api/?name=Doctor+AI"
          />
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Listening to you...</h3>
      <p className="text-sm text-slate-500 mb-8">Speak clearly about your health concerns.</p>
      <div className="flex gap-4">
        <div className="w-1 h-8 bg-primary rounded-full animate-[bounce_1s_infinite]"></div>
        <div className="w-1 h-12 bg-primary rounded-full animate-[bounce_1.2s_infinite]"></div>
        <div className="w-1 h-6 bg-primary rounded-full animate-[bounce_0.8s_infinite]"></div>
        <div className="w-1 h-10 bg-primary rounded-full animate-[bounce_1.1s_infinite]"></div>
        <div className="w-1 h-8 bg-primary rounded-full animate-[bounce_0.9s_infinite]"></div>
      </div>
    </div>
  );
};
