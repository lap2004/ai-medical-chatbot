
import React, { useState } from 'react';
import { WidgetHeader } from './WidgetHeader';
import { WidgetTabs } from './WidgetTabs';
import { WidgetChat } from './WidgetChat';
import { WidgetVoice } from './WidgetVoice';
import { WidgetHistory } from './WidgetHistory';
import { useChat } from '@/services/hooks/hookChat';


export const DoctorWidget: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'history'>('chat');
  const chat = useChat();

  return (
    <div className="fixed bottom-20 right-8 w-full max-w-[380px] h-[580px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <WidgetHeader onClose={onClose} />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'chat' && <WidgetChat {...chat} />}
        {activeTab === 'voice' && <WidgetVoice />}
        {activeTab === 'history' && <WidgetHistory {...chat} onSelect={() => setActiveTab('chat')} />}
      </div>

      <WidgetTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
