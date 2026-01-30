
import React from 'react';

interface TabsProps {
  activeTab: 'chat' | 'voice' | 'history';
  onTabChange: (tab: 'chat' | 'voice' | 'history') => void;
}

export const WidgetTabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-3xl">
      <div className="flex justify-around items-center">
        <button 
          onClick={() => onTabChange('chat')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'chat' ? 'text-primary' : 'text-slate-400'}`}
        >
          <span className="material-icons-round">chat_bubble</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
        </button>
        <button 
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-primary' : 'text-slate-400'}`}
        >
          <span className="material-icons-round">history</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
        </button>
      </div>
      <p className="text-[9px] text-center text-slate-400 mt-4">Powered by HealthAI Companion</p>
    </div>
  );
};
