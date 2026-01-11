
import React from 'react';

export const ChatHeader: React.FC = () => {
  return (
    <header className="glass-effect border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img 
            alt="Rebecca AI" 
            className="w-12 h-12 rounded-full border-2 border-primary/20 object-cover" 
            src="https://picsum.photos/seed/doctor1/200/200" 
          />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Rebecca AI</h2>
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">ASSISTANT</span>
          </div>
          <p className="text-xs text-slate-500">Live Health Guidance</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button className="px-5 py-2 rounded-xl bg-white dark:bg-slate-700 text-primary dark:text-white text-sm font-bold shadow-sm flex items-center space-x-2 transition-all">
            <span className="material-icons-round text-lg">chat</span>
            <span>Chat</span>
          </button>
          <button className="px-5 py-2 rounded-xl text-slate-500 hover:text-primary dark:hover:text-white text-sm font-semibold flex items-center space-x-2 transition-all">
            <span className="material-icons-round text-lg">keyboard_voice</span>
            <span>Voice</span>
          </button>
        </div>
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
        <button className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
          <span className="material-icons-round">more_vert</span>
        </button>
      </div>
    </header>
  );
};
