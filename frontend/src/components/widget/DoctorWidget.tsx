
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
    <div
      className="
    fixed z-[100]
    right-4 left-4 bottom-4
    sm:left-auto sm:right-8 sm:bottom-20
    w-auto sm:w-full sm:max-w-[380px]
    h-[75vh] sm:h-[580px]
    bg-white dark:bg-slate-900
    rounded-3xl
    border border-slate-200 dark:border-slate-800
    flex flex-col
    animate-in fade-in slide-in-from-bottom-4 duration-300
  "
    >
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
