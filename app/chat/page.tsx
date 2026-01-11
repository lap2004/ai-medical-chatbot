
import React, { useState, useRef, useEffect } from 'react';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { TriageCard } from '../../components/chat/TriageCard';
import { useChat } from '../../hooks/useChat';

const ChatPage: React.FC = () => {
  const { 
    conversations, 
    activeConversation, 
    sendMessage, 
    createNewConversation, 
    selectConversation, 
    activeId,
    loading 
  } = useChat();
  
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, loading]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <ChatSidebar 
        conversations={conversations} 
        activeId={activeId} 
        onSelect={selectConversation} 
        onNew={createNewConversation} 
      />

      <main className="flex-1 flex flex-col relative bg-white dark:bg-slate-900">
        <ChatHeader />

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/20 custom-scrollbar">
          <div className="text-center py-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-4 py-1.5 border border-slate-200 dark:border-slate-800 rounded-full">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {!activeConversation && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-2">
                <span className="material-icons-round text-4xl">medical_information</span>
              </div>
              <h2 className="text-2xl font-bold dark:text-white">Start a Consultation</h2>
              <p className="text-slate-500">Our AI assistant Rebecca is ready to help you with symptoms, advice, or medical information.</p>
              <button 
                onClick={createNewConversation}
                className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg"
              >
                Start New Chat
              </button>
            </div>
          )}

          {activeConversation?.messages.map((msg) => (
            <div key={msg.id} className={`flex items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'} space-x-4`}>
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="material-icons-round text-white text-sm">smart_toy</span>
                </div>
              )}
              <div className="flex flex-col space-y-3">
                {msg.triage ? (
                  <TriageCard 
                    questions={msg.triage.questions} 
                    suggestedAnswers={msg.triage.suggestedAnswers} 
                    onSelect={(ans) => sendMessage(ans)} 
                  />
                ) : (
                  <div className={`p-5 shadow-sm border ${
                    msg.role === 'user' 
                    ? 'bg-primary text-white border-primary rounded-3xl rounded-tr-none max-w-xl' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700 rounded-3xl rounded-tl-none max-w-3xl'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}
                <div className={`flex items-center space-x-2 ${msg.role === 'user' ? 'justify-end mr-1' : 'ml-1'}`}>
                  {msg.role === 'user' && <span className="material-icons-round text-[12px] text-green-500">done_all</span>}
                  <span className="text-[10px] font-medium text-slate-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start space-x-4">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="material-icons-round text-white text-sm animate-pulse">smart_toy</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl rounded-tl-none border border-slate-100 dark:border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            </div>
          )}
        </div>

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
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Tell me more about your symptoms..." 
                  className="w-full pl-14 pr-14 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-teal-500/20"
                >
                  <span className="material-icons-round text-xl">send</span>
                </button>
              </div>
              <button className="group flex flex-col items-center justify-center w-14 h-14 bg-white dark:bg-slate-800 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-2xl transition-all shrink-0">
                <span className="material-icons-round text-primary text-2xl group-hover:scale-110 transition-transform">mic</span>
                <span className="text-[8px] font-bold text-primary mt-0.5">VOICE</span>
              </button>
            </div>
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span>Secure Channel Active</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                Not for medical emergencies. By using this service you agree to our <a href="#" className="underline font-medium hover:text-primary">Terms of Use</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
